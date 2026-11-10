import { Types } from "mongoose";
import { conectarDB } from "./db";
import { Reserva, ESTADOS_RESERVA, type ReservaDoc } from "@/models/Reserva";
import { Ocupacion } from "@/models/Ocupacion";
import { Habitacion } from "@/models/Habitacion";

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

export type ReservaAdmin = {
  id: string;
  codigo: string;
  habitacion: string;
  llegada: string;
  salida: string;
  noches: number;
  total: number;
  huespedes: number;
  estado: EstadoReserva;
  nombre: string;
  telefono: string;
  notas: string;
  creada: string; // ISO
};

type ReservaLean = ReservaDoc & { _id: Types.ObjectId; createdAt: Date };

function aAdmin(r: ReservaLean): ReservaAdmin {
  return {
    id: r._id.toString(),
    codigo: r.codigo,
    habitacion: r.nombreHabitacion,
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
  };
}

export const esEstado = (valor: unknown): valor is EstadoReserva =>
  typeof valor === "string" && (ESTADOS_RESERVA as readonly string[]).includes(valor);

/** Reservas para el panel, ordenadas por fecha de llegada. */
export async function listarReservas(estado?: EstadoReserva): Promise<ReservaAdmin[]> {
  await conectarDB();
  const filtro = estado ? { estado } : {};
  const docs = await Reserva.find(filtro).sort({ llegada: 1, createdAt: 1 }).limit(200).lean<ReservaLean[]>();
  return docs.map(aAdmin);
}

/** Cuántas reservas hay en cada estado: { pendiente: 3, confirmada: 5, cancelada: 1 } */
export async function contarPorEstado(): Promise<Record<EstadoReserva, number>> {
  await conectarDB();
  const grupos = await Reserva.aggregate<{ _id: EstadoReserva; total: number }>([
    { $group: { _id: "$estado", total: { $sum: 1 } } },
  ]);
  const conteo = { pendiente: 0, confirmada: 0, cancelada: 0 };
  for (const g of grupos) if (esEstado(g._id)) conteo[g._id] = g.total;
  return conteo;
}

/** "3005551234" → "300 555 1234" */
export const telefonoLegible = (t: string) => t.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");

// ---------------------------------------------------------------------------
// Cambios de estado
// ---------------------------------------------------------------------------

/**
 * Transiciones permitidas. Una reserva cancelada no se puede reactivar:
 * sus noches ya se liberaron y otra persona pudo haberlas tomado.
 */
const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["cancelada"],
  cancelada: [],
};

export type ResultadoCambio =
  | { ok: true; reserva: ReservaAdmin }
  | { ok: false; status: 404 | 409; mensaje: string };

export async function cambiarEstado(id: string, nuevo: EstadoReserva): Promise<ResultadoCambio> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La reserva no existe" };
  await conectarDB();

  const origenes = (Object.keys(TRANSICIONES) as EstadoReserva[]).filter((e) => TRANSICIONES[e].includes(nuevo));

  // La condición sobre el estado actual hace el cambio atómico: si dos personas
  // del hotel pulsan a la vez "Confirmar" y "Cancelar", solo una gana.
  const actualizada = await Reserva.findOneAndUpdate(
    { _id: id, estado: { $in: origenes } },
    { $set: { estado: nuevo } },
    { new: true }
  ).lean<ReservaLean>();

  if (!actualizada) {
    const existe = await Reserva.findById(id).select("estado").lean();
    if (!existe) return { ok: false, status: 404, mensaje: "La reserva no existe" };
    return { ok: false, status: 409, mensaje: `Una reserva ${existe.estado} no se puede pasar a ${nuevo}` };
  }

  // Al cancelar se liberan las noches para que otros huéspedes puedan reservarlas
  if (nuevo === "cancelada") await Ocupacion.deleteMany({ reserva: actualizada._id });

  return { ok: true, reserva: aAdmin(actualizada) };
}

// ---------------------------------------------------------------------------
// Resumen del día
// ---------------------------------------------------------------------------

export type ResumenDia = {
  ocupadasHoy: number;
  totalHabitaciones: number;
  llegadas: ReservaAdmin[];
  salidas: ReservaAdmin[];
  pendientes: number;
};

export async function resumenDelDia(hoy: string): Promise<ResumenDia> {
  await conectarDB();
  const activas = { estado: { $ne: "cancelada" as const } };
  const [ocupadas, totalHabitaciones, llegadas, salidas, pendientes] = await Promise.all([
    Ocupacion.distinct("habitacion", { fecha: hoy }),
    Habitacion.countDocuments({ activa: true }),
    Reserva.find({ ...activas, llegada: hoy }).sort({ createdAt: 1 }).lean<ReservaLean[]>(),
    Reserva.find({ ...activas, salida: hoy }).sort({ createdAt: 1 }).lean<ReservaLean[]>(),
    Reserva.countDocuments({ estado: "pendiente" }),
  ]);
  return {
    ocupadasHoy: ocupadas.length,
    totalHabitaciones,
    llegadas: llegadas.map(aAdmin),
    salidas: salidas.map(aAdmin),
    pendientes,
  };
}
