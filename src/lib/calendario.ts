import { Types } from "mongoose";
import { conectarDB } from "./db";
import { contarNoches, nochesEntre, sumarDias } from "./fechas";
import type { EstadoReserva } from "./reservas-estados";
import { Bloqueo } from "@/models/Bloqueo";
import { Habitacion } from "@/models/Habitacion";
import { Ocupacion } from "@/models/Ocupacion";
import { Reserva } from "@/models/Reserva";

export const MAX_NOCHES_BLOQUEO = 180;

export type SegmentoCalendario =
  | { tipo: "reserva"; id: string; codigo: string; huesped: string; estado: EstadoReserva; llegada: string; salida: string; desde: number; largo: number }
  | { tipo: "bloqueo"; id: string; motivo: string; desde: number; largo: number };

export type FilaCalendario = {
  habitacionId: string;
  nombre: string;
  /** Segmentos recortados a la ventana; `desde` es la columna (0 = primer día) y `largo` cuántas columnas ocupa */
  segmentos: SegmentoCalendario[];
};

export type Calendario = { desde: string; dias: string[]; filas: FilaCalendario[] };

/**
 * Ocupación de cada habitación activa en una ventana de días. Se arma desde las noches ocupadas
 * (la misma fuente que impide las reservas dobles), así lo que se ve es lo que el sistema respeta.
 */
export async function obtenerCalendario(desde: string, cantidad: number): Promise<Calendario> {
  await conectarDB();
  const dias = Array.from({ length: cantidad }, (_, i) => sumarDias(desde, i));
  const ultimo = dias[dias.length - 1];

  const [habitaciones, noches] = await Promise.all([
    Habitacion.find({ activa: true }).sort({ nombre: 1 }).lean(),
    Ocupacion.find({ fecha: { $gte: desde, $lte: ultimo } }).lean(),
  ]);

  const idsReserva = [...new Set(noches.filter((n) => n.reserva).map((n) => String(n.reserva)))];
  const idsBloqueo = [...new Set(noches.filter((n) => n.bloqueo).map((n) => String(n.bloqueo)))];
  const [reservas, bloqueos] = await Promise.all([
    Reserva.find({ _id: { $in: idsReserva } }).lean(),
    Bloqueo.find({ _id: { $in: idsBloqueo } }).lean(),
  ]);
  const reservaPorId = new Map(reservas.map((r) => [String(r._id), r]));
  const bloqueoPorId = new Map(bloqueos.map((b) => [String(b._id), b]));

  // Noches agrupadas por dueño (reserva o bloqueo) dentro de cada habitación
  const grupos = new Map<string, { habitacion: string; tipo: "reserva" | "bloqueo"; id: string; fechas: string[] }>();
  for (const n of noches) {
    const tipo = n.reserva ? "reserva" : "bloqueo";
    const id = String(n.reserva ?? n.bloqueo);
    const clave = `${n.habitacion}|${tipo}|${id}`;
    const g = grupos.get(clave) ?? { habitacion: String(n.habitacion), tipo, id, fechas: [] };
    g.fechas.push(n.fecha);
    grupos.set(clave, g);
  }

  const filas: FilaCalendario[] = habitaciones.map((h) => ({ habitacionId: String(h._id), nombre: h.nombre, segmentos: [] }));
  const filaPorId = new Map(filas.map((f) => [f.habitacionId, f]));
  for (const g of grupos.values()) {
    const fila = filaPorId.get(g.habitacion);
    if (!fila) continue; // habitación oculta: no se muestra
    g.fechas.sort();
    const desdeCol = dias.indexOf(g.fechas[0]);
    const base = { desde: desdeCol, largo: g.fechas.length };
    if (g.tipo === "reserva") {
      const r = reservaPorId.get(g.id);
      if (!r) continue;
      fila.segmentos.push({
        tipo: "reserva",
        id: g.id,
        codigo: r.codigo,
        huesped: r.huesped?.nombre ?? "",
        estado: (r.estado ?? "pendiente") as EstadoReserva,
        llegada: r.llegada,
        salida: r.salida,
        ...base,
      });
    } else {
      const b = bloqueoPorId.get(g.id);
      if (!b) continue;
      fila.segmentos.push({ tipo: "bloqueo", id: g.id, motivo: b.motivo ?? "", ...base });
    }
  }
  for (const f of filas) f.segmentos.sort((a, b) => a.desde - b.desde);
  return { desde, dias, filas };
}

// ---------------------------------------------------------------------------
// Bloqueos
// ---------------------------------------------------------------------------

export type BloqueoAdmin = {
  id: string;
  habitacionId: string;
  habitacion: string;
  desde: string;
  /** Último día bloqueado (inclusive), pensado para mostrarlo a una persona */
  ultimoDia: string;
  noches: number;
  motivo: string;
};

/** Bloqueos que aún no terminaron, del más próximo al más lejano. */
export async function listarBloqueos(hoy: string): Promise<BloqueoAdmin[]> {
  await conectarDB();
  const [bloqueos, habitaciones] = await Promise.all([
    Bloqueo.find({ hasta: { $gt: hoy } }).sort({ desde: 1 }).lean(),
    Habitacion.find({}, { nombre: 1 }).lean(),
  ]);
  const nombres = new Map(habitaciones.map((h) => [String(h._id), h.nombre]));
  return bloqueos.map((b) => ({
    id: String(b._id),
    habitacionId: String(b.habitacion),
    habitacion: nombres.get(String(b.habitacion)) ?? "Habitación eliminada",
    desde: b.desde,
    ultimoDia: sumarDias(b.hasta, -1),
    noches: contarNoches(b.desde, b.hasta),
    motivo: b.motivo ?? "",
  }));
}

export type ResultadoBloqueo = { ok: true; id: string } | { ok: false; status: 404 | 409 | 422; mensaje: string };

/** `ultimoDia` es inclusive: bloquear del 10 al 12 deja ocupadas las noches 10, 11 y 12. */
export async function crearBloqueo(
  datos: { habitacion: string; desde: string; ultimoDia: string; motivo: string },
  hoy: string,
  autor: string
): Promise<ResultadoBloqueo> {
  if (!Types.ObjectId.isValid(datos.habitacion)) return { ok: false, status: 404, mensaje: "La habitación no existe" };
  if (datos.desde < hoy) return { ok: false, status: 422, mensaje: "No se pueden bloquear fechas que ya pasaron" };
  if (datos.ultimoDia < datos.desde) return { ok: false, status: 422, mensaje: "La fecha final debe ser igual o posterior a la inicial" };
  const hasta = sumarDias(datos.ultimoDia, 1);
  const noches = nochesEntre(datos.desde, hasta);
  if (noches.length > MAX_NOCHES_BLOQUEO) {
    return { ok: false, status: 422, mensaje: `Puedes bloquear máximo ${MAX_NOCHES_BLOQUEO} noches seguidas` };
  }

  await conectarDB();
  await Ocupacion.init();
  const habitacion = await Habitacion.findById(datos.habitacion).lean();
  if (!habitacion) return { ok: false, status: 404, mensaje: "La habitación no existe" };

  // Revisión previa solo para poder explicar qué estorba; la garantía real es el índice único al insertar
  const choques = await Ocupacion.find({ habitacion: habitacion._id, fecha: { $in: noches } }).lean();
  if (choques.length > 0) {
    const reservas = await Reserva.find({ _id: { $in: choques.filter((c) => c.reserva).map((c) => c.reserva) } }, { codigo: 1, huesped: 1 }).lean();
    const detalle = reservas.slice(0, 3).map((r) => `${r.codigo} (${r.huesped?.nombre ?? "sin nombre"})`).join(", ");
    const hayBloqueo = choques.some((c) => c.bloqueo);
    const partes = [
      reservas.length > 0 ? `hay reservas en esas fechas: ${detalle}${reservas.length > 3 ? " y más" : ""}` : "",
      hayBloqueo ? "ya hay un bloqueo en esas fechas" : "",
    ].filter(Boolean);
    return { ok: false, status: 409, mensaje: `No se puede bloquear: ${partes.join("; ")}. Modifica o cancela esas reservas primero.` };
  }

  const bloqueo = await Bloqueo.create({
    habitacion: habitacion._id,
    desde: datos.desde,
    hasta,
    motivo: datos.motivo,
    creadoPor: autor,
  });
  try {
    await Ocupacion.insertMany(
      noches.map((fecha) => ({ habitacion: habitacion._id, fecha, bloqueo: bloqueo._id })),
      { ordered: true }
    );
  } catch (error) {
    await Promise.all([Ocupacion.deleteMany({ bloqueo: bloqueo._id }), Bloqueo.deleteOne({ _id: bloqueo._id })]);
    if ((error as { code?: number }).code === 11000) {
      return { ok: false, status: 409, mensaje: "Alguien reservó esas fechas justo ahora. Revisa el calendario e inténtalo otra vez." };
    }
    throw error;
  }
  return { ok: true, id: String(bloqueo._id) };
}

export async function eliminarBloqueo(id: string): Promise<{ ok: true } | { ok: false; status: 404; mensaje: string }> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "El bloqueo no existe" };
  await conectarDB();
  const borrado = await Bloqueo.findByIdAndDelete(id);
  if (!borrado) return { ok: false, status: 404, mensaje: "El bloqueo no existe" };
  await Ocupacion.deleteMany({ bloqueo: borrado._id });
  return { ok: true };
}
