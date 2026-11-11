import { Types } from "mongoose";
import { conectarDB } from "./db";
import { contarNoches, fechaLegible, hoyEnColombia, nochesEntre } from "./fechas";
import { formatearPrecio } from "./formato";
import { crearReserva, type ResultadoReserva } from "./reservas";
import type { DatosReservaPanel } from "./validacion";
import { Habitacion } from "@/models/Habitacion";
import { Ocupacion } from "@/models/Ocupacion";
import { Reserva } from "@/models/Reserva";

export type HabitacionParaReserva = {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  precioNoche: number;
  libre: boolean;
  /** Por qué no se puede elegir (solo si libre = false) */
  motivo?: string;
};

/**
 * Todas las habitaciones activas, indicando cuáles están libres en el rango.
 * `excluirReserva` sirve al modificar una reserva: sus propias noches no cuentan como ocupadas.
 */
export async function habitacionesParaReserva(
  llegada: string,
  salida: string,
  huespedes: number,
  excluirReserva?: string
): Promise<HabitacionParaReserva[]> {
  await conectarDB();
  const noches = nochesEntre(llegada, salida);
  const filtro: Record<string, unknown> = { fecha: { $in: noches } };
  if (excluirReserva && Types.ObjectId.isValid(excluirReserva)) {
    filtro.reserva = { $ne: new Types.ObjectId(excluirReserva) };
  }
  const [habitaciones, ocupadas] = await Promise.all([
    Habitacion.find({ activa: true }).sort({ precioNoche: 1, nombre: 1 }).lean(),
    Ocupacion.distinct("habitacion", filtro),
  ]);
  const ocupadasIds = new Set(ocupadas.map((id) => id.toString()));

  return habitaciones.map((h) => {
    const base = {
      id: h._id.toString(),
      nombre: h.nombre,
      tipo: h.tipo,
      capacidad: h.capacidad,
      precioNoche: h.precioNoche,
    };
    if (ocupadasIds.has(base.id)) return { ...base, libre: false, motivo: "Ocupada o bloqueada en esas fechas" };
    if (h.capacidad < huespedes) {
      return { ...base, libre: false, motivo: `Admite máximo ${h.capacidad} ${h.capacidad === 1 ? "persona" : "personas"}` };
    }
    return { ...base, libre: true };
  });
}

/** Reserva creada por el personal (llamada, WhatsApp, mostrador). Nace pendiente o confirmada. */
export async function crearReservaManual(datos: DatosReservaPanel, autor: string): Promise<ResultadoReserva> {
  if (datos.llegada < hoyEnColombia()) {
    return { ok: false, status: 422, mensaje: "La llegada no puede ser anterior a hoy" };
  }
  return crearReserva(datos, {
    estado: datos.estado ?? "confirmada",
    autor,
    precioNoche: datos.precioNoche,
  });
}

export type ResultadoEdicion = { ok: true } | { ok: false; status: 404 | 409 | 422; mensaje: string };

/**
 * Modifica fechas, habitación, huéspedes, precio y datos del huésped de una reserva pendiente o confirmada.
 *
 * Orden pensado para no dejar nunca una noche sin dueño ni una reserva doble:
 *  1. Se bloquean las noches nuevas (el índice único rechaza si alguien más las tiene).
 *  2. Se actualiza la reserva solo si nadie la cambió mientras tanto.
 *  3. Se liberan las noches que ya no corresponden.
 * Si algo falla en el paso 1 o 2, se deshacen únicamente las noches que este cambio había bloqueado.
 */
export async function editarReserva(id: string, datos: DatosReservaPanel, autor: string): Promise<ResultadoEdicion> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  await conectarDB();
  await Ocupacion.init();

  const actual = await Reserva.findById(id).lean();
  if (!actual) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  const estado = actual.estado ?? "pendiente";
  if (estado !== "pendiente" && estado !== "confirmada") {
    return { ok: false, status: 409, mensaje: "Solo se pueden modificar reservas pendientes o confirmadas" };
  }

  // Se permite conservar una llegada que ya pasó (reserva confirmada que aún no hace check-in),
  // pero no mover la llegada a una fecha pasada.
  if (datos.llegada !== actual.llegada && datos.llegada < hoyEnColombia()) {
    return { ok: false, status: 422, mensaje: "La llegada no puede ser anterior a hoy" };
  }
  if (!Types.ObjectId.isValid(datos.habitacion)) {
    return { ok: false, status: 404, mensaje: "La habitación no existe" };
  }
  const habitacion = await Habitacion.findById(datos.habitacion).lean();
  const cambiaHabitacion = actual.habitacion.toString() !== datos.habitacion;
  if (!habitacion || (cambiaHabitacion && !habitacion.activa)) {
    return { ok: false, status: 404, mensaje: "La habitación no existe o no está disponible" };
  }
  if (datos.huespedes > habitacion.capacidad) {
    return {
      ok: false,
      status: 422,
      mensaje: `Esta habitación admite máximo ${habitacion.capacidad} ${habitacion.capacidad === 1 ? "persona" : "personas"}`,
    };
  }

  const precioNoche = datos.precioNoche ?? (cambiaHabitacion ? habitacion.precioNoche : actual.precioNoche);
  const noches = contarNoches(datos.llegada, datos.salida);
  const nuevasNoches = nochesEntre(datos.llegada, datos.salida);

  // Noches que la reserva ya tiene bloqueadas y siguen sirviendo (misma habitación y misma fecha)
  const existentes = await Ocupacion.find({ reserva: actual._id }).lean();
  const conservar = existentes.filter(
    (o) => o.habitacion.toString() === datos.habitacion && nuevasNoches.includes(o.fecha)
  );
  const fechasConservadas = new Set(conservar.map((o) => o.fecha));
  const porBloquear = nuevasNoches
    .filter((f) => !fechasConservadas.has(f))
    .map((fecha) => ({ _id: new Types.ObjectId(), habitacion: habitacion._id, fecha, reserva: actual._id }));
  const idsNuevos = porBloquear.map((o) => o._id);

  // 1. Bloquear noches nuevas
  if (porBloquear.length > 0) {
    try {
      await Ocupacion.insertMany(porBloquear, { ordered: true });
    } catch (error) {
      await Ocupacion.deleteMany({ _id: { $in: idsNuevos } });
      if ((error as { code?: number }).code === 11000) {
        return { ok: false, status: 409, mensaje: "La habitación no está libre en las fechas elegidas. Prueba con otras." };
      }
      throw error;
    }
  }

  // 2. Actualizar la reserva solo si sigue como la leímos
  const cambios: string[] = [];
  if (datos.llegada !== actual.llegada || datos.salida !== actual.salida) {
    cambios.push(`fechas ${fechaLegible(actual.llegada)} → ${fechaLegible(actual.salida)} a ${fechaLegible(datos.llegada)} → ${fechaLegible(datos.salida)}`);
  }
  if (cambiaHabitacion) cambios.push(`habitación ${actual.nombreHabitacion} a ${habitacion.nombre}`);
  if (datos.huespedes !== actual.huespedes) cambios.push(`huéspedes ${actual.huespedes} a ${datos.huespedes}`);
  if (precioNoche !== actual.precioNoche) cambios.push(`precio por noche ${formatearPrecio(actual.precioNoche)} a ${formatearPrecio(precioNoche)}`);
  if (datos.nombre !== actual.huesped?.nombre || datos.telefono !== actual.huesped?.telefono) cambios.push("datos del huésped");
  if ((datos.notas ?? "") !== (actual.notas ?? "")) cambios.push("notas del huésped");
  const evento = cambios.length > 0 ? `Reserva modificada: ${cambios.join("; ")}` : "Reserva revisada sin cambios";

  const actualizada = await Reserva.findOneAndUpdate(
    {
      _id: actual._id,
      estado,
      habitacion: actual.habitacion,
      llegada: actual.llegada,
      salida: actual.salida,
    },
    {
      $set: {
        habitacion: habitacion._id,
        nombreHabitacion: habitacion.nombre,
        precioNoche,
        llegada: datos.llegada,
        salida: datos.salida,
        noches,
        total: precioNoche * noches,
        huespedes: datos.huespedes,
        "huesped.nombre": datos.nombre,
        "huesped.telefono": datos.telefono,
        notas: datos.notas ?? "",
      },
      $push: { historial: { evento, fecha: new Date(), autor } },
    },
    { new: true }
  ).lean();

  if (!actualizada) {
    if (idsNuevos.length > 0) await Ocupacion.deleteMany({ _id: { $in: idsNuevos } });
    return { ok: false, status: 409, mensaje: "La reserva cambió mientras la editabas. Ábrela de nuevo e inténtalo otra vez." };
  }

  // 3. Liberar lo que ya no corresponde
  const mantener = [...conservar.map((o) => o._id), ...idsNuevos];
  await Ocupacion.deleteMany({ reserva: actual._id, _id: { $nin: mantener } });

  return { ok: true };
}
