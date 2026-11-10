import type { Types } from "mongoose";
import { conectarDB } from "./db";
import { Reserva, ESTADOS_RESERVA, type ReservaDoc } from "@/models/Reserva";

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
