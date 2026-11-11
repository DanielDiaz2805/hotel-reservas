import { Types } from "mongoose";
import { conectarDB } from "./db";
import { esFechaValida, fechaLegible, hoyEnColombia } from "./fechas";
import { ESTADOS, ESTADOS_ACTIVOS, ETIQUETA_ESTADO, esEstado, type EstadoReserva } from "./reservas-estados";
import { Reserva, type ReservaDoc } from "@/models/Reserva";
import { Ocupacion } from "@/models/Ocupacion";
import { Habitacion } from "@/models/Habitacion";

export { esEstado };
export type { EstadoReserva };

export type NotaInterna = { id: string; texto: string; fecha: string; autor: string };
export type EventoHistorial = { evento: string; fecha: string; autor: string };

export type ReservaAdmin = {
  id: string;
  codigo: string;
  habitacionId: string;
  habitacion: string;
  precioNoche: number;
  llegada: string;
  salida: string;
  noches: number;
  total: number;
  huespedes: number;
  estado: EstadoReserva;
  nombre: string;
  telefono: string;
  notas: string; // lo que escribió el huésped al reservar
  creada: string; // ISO
  notasInternas: NotaInterna[];
  historial: EventoHistorial[];
};

type NotaLean = { _id: Types.ObjectId; texto: string; fecha: Date; autor?: string };
type EventoLean = { evento: string; fecha: Date; autor?: string };
type ReservaLean = Omit<ReservaDoc, "notasInternas" | "historial"> & {
  _id: Types.ObjectId;
  createdAt: Date;
  notasInternas?: NotaLean[];
  historial?: EventoLean[];
};

const aNota = (n: NotaLean): NotaInterna => ({
  id: n._id.toString(),
  texto: n.texto,
  fecha: new Date(n.fecha).toISOString(),
  autor: n.autor ?? "",
});

function aAdmin(r: ReservaLean): ReservaAdmin {
  return {
    id: r._id.toString(),
    codigo: r.codigo,
    habitacionId: r.habitacion.toString(),
    habitacion: r.nombreHabitacion,
    precioNoche: r.precioNoche,
    llegada: r.llegada,
    salida: r.salida,
    noches: r.noches,
    total: r.total,
    huespedes: r.huespedes,
    estado: (r.estado ?? "pendiente") as EstadoReserva,
    nombre: r.huesped?.nombre ?? "",
    telefono: r.huesped?.telefono ?? "",
    notas: r.notas ?? "",
    creada: new Date(r.createdAt).toISOString(),
    // Las reservas anteriores a estas funciones no tienen notas ni historial
    notasInternas: (r.notasInternas ?? []).map(aNota),
    historial: (r.historial ?? []).map((e) => ({ evento: e.evento, fecha: new Date(e.fecha).toISOString(), autor: e.autor ?? "" })),
  };
}

export async function obtenerReservaAdmin(id: string): Promise<ReservaAdmin | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await conectarDB();
  const doc = await Reserva.findById(id).lean<ReservaLean>();
  return doc ? aAdmin(doc) : null;
}

// ---------------------------------------------------------------------------
// Búsqueda y filtros
// ---------------------------------------------------------------------------

export const RESERVAS_POR_PAGINA = 15;

export type FiltroEstado = EstadoReserva | "activas" | "todas";

export type FiltrosReservas = {
  /** Texto libre: nombre, código o teléfono */
  q?: string;
  estado?: FiltroEstado;
  habitacion?: string;
  /** Rango sobre la fecha de llegada, AAAA-MM-DD */
  desde?: string;
  hasta?: string;
  pagina?: number;
};

export type PaginaReservas = { reservas: ReservaAdmin[]; total: number; pagina: number; paginas: number };

const escaparRegExp = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function buscarReservas(f: FiltrosReservas): Promise<PaginaReservas> {
  await conectarDB();
  const estado: FiltroEstado = f.estado ?? "activas";
  const filtro: Record<string, unknown> = {};

  if (estado === "activas") filtro.estado = { $in: ESTADOS_ACTIVOS };
  else if (estado !== "todas") filtro.estado = estado;

  const texto = (f.q ?? "").trim().slice(0, 40);
  if (texto) {
    const patron = { $regex: escaparRegExp(texto), $options: "i" };
    const opciones: Record<string, unknown>[] = [{ codigo: patron }, { "huesped.nombre": patron }];
    const digitos = texto.replace(/\D/g, "");
    if (digitos.length >= 3) opciones.push({ "huesped.telefono": { $regex: escaparRegExp(digitos) } });
    filtro.$or = opciones;
  }

  if (f.habitacion && Types.ObjectId.isValid(f.habitacion)) filtro.habitacion = new Types.ObjectId(f.habitacion);

  const rango: Record<string, string> = {};
  if (f.desde && esFechaValida(f.desde)) rango.$gte = f.desde;
  if (f.hasta && esFechaValida(f.hasta)) rango.$lte = f.hasta;
  if (Object.keys(rango).length > 0) filtro.llegada = rango;

  // Lo vigente se ordena por llegada próxima; lo cerrado, por lo más reciente
  const ascendente = estado === "activas" || estado === "pendiente" || estado === "confirmada" || estado === "en_casa";
  const orden = ascendente ? 1 : -1;

  const total = await Reserva.countDocuments(filtro);
  const paginas = Math.max(1, Math.ceil(total / RESERVAS_POR_PAGINA));
  const pagina = Math.min(Math.max(1, Math.floor(f.pagina ?? 1)), paginas);

  const docs = await Reserva.find(filtro)
    .sort({ llegada: orden, createdAt: orden })
    .skip((pagina - 1) * RESERVAS_POR_PAGINA)
    .limit(RESERVAS_POR_PAGINA)
    .lean<ReservaLean[]>();

  return { reservas: docs.map(aAdmin), total, pagina, paginas };
}

/** Cuántas reservas hay en cada estado: { pendiente: 3, confirmada: 5, en_casa: 1, ... } */
export async function contarPorEstado(): Promise<Record<EstadoReserva, number>> {
  await conectarDB();
  const grupos = await Reserva.aggregate<{ _id: string; total: number }>([{ $group: { _id: "$estado", total: { $sum: 1 } } }]);
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<EstadoReserva, number>;
  for (const g of grupos) if (esEstado(g._id)) conteo[g._id] = g.total;
  return conteo;
}

/** "3005551234" → "300 555 1234" */
export const telefonoLegible = (t: string) => t.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");

// ---------------------------------------------------------------------------
// Cambios de estado
// ---------------------------------------------------------------------------

/**
 * Transiciones permitidas:
 *   pendiente → confirmada → en casa (check-in) → finalizada (check-out)
 * Se puede cancelar mientras el huésped no haya llegado. Una reserva cancelada no se reactiva:
 * sus noches ya se liberaron y otra persona pudo haberlas tomado.
 */
const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["en_casa", "cancelada"],
  en_casa: ["finalizada"],
  finalizada: [],
  cancelada: [],
};

const EVENTO: Record<EstadoReserva, string> = {
  pendiente: "Reserva pendiente",
  confirmada: "Reserva confirmada",
  en_casa: "Check-in: el huésped llegó",
  finalizada: "Check-out: el huésped salió",
  cancelada: "Reserva cancelada",
};

export type ResultadoCambio =
  | { ok: true; reserva: ReservaAdmin }
  | { ok: false; status: 404 | 409; mensaje: string };

export async function cambiarEstado(id: string, nuevo: EstadoReserva, autor = ""): Promise<ResultadoCambio> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  await conectarDB();

  const hoy = hoyEnColombia();
  const origenes = ESTADOS.filter((e) => TRANSICIONES[e].includes(nuevo));

  // La condición sobre el estado actual hace el cambio atómico: si dos personas
  // del hotel pulsan a la vez "Confirmar" y "Cancelar", solo una gana.
  const condicion: Record<string, unknown> = { _id: id, estado: { $in: origenes } };
  // El check-in solo se hace desde el día de llegada: antes, la habitación puede seguir ocupada
  if (nuevo === "en_casa") condicion.llegada = { $lte: hoy };

  const actualizada = await Reserva.findOneAndUpdate(
    condicion,
    { $set: { estado: nuevo }, $push: { historial: { evento: EVENTO[nuevo], fecha: new Date(), autor } } },
    { new: true }
  ).lean<ReservaLean>();

  if (!actualizada) {
    const existe = await Reserva.findById(id).select("estado llegada").lean<{ estado?: string; llegada: string }>();
    if (!existe) return { ok: false, status: 404, mensaje: "La reserva no existe" };
    const actual = (existe.estado ?? "pendiente") as EstadoReserva;
    if (nuevo === "en_casa" && origenes.includes(actual)) {
      return {
        ok: false,
        status: 409,
        mensaje: `Esta reserva llega el ${fechaLegible(existe.llegada)}. El check-in se puede hacer desde ese día.`,
      };
    }
    return {
      ok: false,
      status: 409,
      mensaje: `Una reserva ${ETIQUETA_ESTADO[actual].toLowerCase()} no se puede pasar a ${ETIQUETA_ESTADO[nuevo].toLowerCase()}`,
    };
  }

  // Al cancelar se liberan todas las noches para que otros huéspedes puedan reservarlas
  if (nuevo === "cancelada") await Ocupacion.deleteMany({ reserva: actualizada._id });
  // Si el huésped se va antes de lo previsto, las noches que ya no usará quedan libres
  if (nuevo === "finalizada") await Ocupacion.deleteMany({ reserva: actualizada._id, fecha: { $gte: hoy } });

  return { ok: true, reserva: aAdmin(actualizada) };
}

// ---------------------------------------------------------------------------
// Notas internas
// ---------------------------------------------------------------------------

export type ResultadoNotas = { ok: true; notas: NotaInterna[] } | { ok: false; status: 404; mensaje: string };

const MAX_NOTAS = 50;

export async function agregarNota(id: string, texto: string, autor: string): Promise<ResultadoNotas> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  await conectarDB();
  const doc = await Reserva.findByIdAndUpdate(
    id,
    { $push: { notasInternas: { $each: [{ texto, autor, fecha: new Date() }], $slice: -MAX_NOTAS } } },
    { new: true }
  ).lean<ReservaLean>();
  if (!doc) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  return { ok: true, notas: (doc.notasInternas ?? []).map(aNota) };
}

export async function eliminarNota(id: string, notaId: string): Promise<ResultadoNotas> {
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(notaId)) {
    return { ok: false, status: 404, mensaje: "La nota no existe" };
  }
  await conectarDB();
  const doc = await Reserva.findByIdAndUpdate(id, { $pull: { notasInternas: { _id: new Types.ObjectId(notaId) } } }, { new: true }).lean<ReservaLean>();
  if (!doc) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  return { ok: true, notas: (doc.notasInternas ?? []).map(aNota) };
}

// ---------------------------------------------------------------------------
// Resumen del día
// ---------------------------------------------------------------------------

export type ResumenDia = {
  ocupadasHoy: number;
  totalHabitaciones: number;
  /** Llegadas de hoy, también las que ya hicieron check-in (para ver el avance del día) */
  llegadas: ReservaAdmin[];
  /** Salidas de hoy, también las que ya hicieron check-out */
  salidas: ReservaAdmin[];
  pendientes: ReservaAdmin[];
  totalPendientes: number;
};

export async function resumenDelDia(hoy: string): Promise<ResumenDia> {
  await conectarDB();
  const [ocupadas, totalHabitaciones, llegadas, salidas, pendientes, totalPendientes] = await Promise.all([
    // Solo cuentan las habitaciones con huésped; un bloqueo de fechas no es ocupación
    Ocupacion.distinct("habitacion", { fecha: hoy, reserva: { $exists: true } }),
    Habitacion.countDocuments({ activa: true }),
    Reserva.find({ estado: { $in: ["pendiente", "confirmada", "en_casa"] }, llegada: hoy }).sort({ createdAt: 1 }).lean<ReservaLean[]>(),
    Reserva.find({ estado: { $in: ["confirmada", "en_casa", "finalizada"] }, salida: hoy }).sort({ createdAt: 1 }).lean<ReservaLean[]>(),
    Reserva.find({ estado: "pendiente" }).sort({ llegada: 1, createdAt: 1 }).limit(5).lean<ReservaLean[]>(),
    Reserva.countDocuments({ estado: "pendiente" }),
  ]);
  return {
    ocupadasHoy: ocupadas.length,
    totalHabitaciones,
    llegadas: llegadas.map(aAdmin),
    salidas: salidas.map(aAdmin),
    pendientes: pendientes.map(aAdmin),
    totalPendientes,
  };
}
