import { randomInt } from "node:crypto";
import { Types } from "mongoose";
import { conectarDB } from "./db";
import { contarNoches, nochesEntre } from "./fechas";
import { obtenerHabitaciones, type HabitacionPublica } from "./habitaciones";
import type { DatosReserva } from "./validacion";
import { Habitacion } from "@/models/Habitacion";
import { Ocupacion } from "@/models/Ocupacion";
import { Reserva } from "@/models/Reserva";

export type HabitacionDisponible = HabitacionPublica & { noches: number; total: number };

/** Habitaciones activas con capacidad suficiente y sin ninguna noche ocupada en el rango. */
export async function habitacionesDisponibles(
  llegada: string,
  salida: string,
  huespedes: number
): Promise<HabitacionDisponible[]> {
  await conectarDB();
  const noches = nochesEntre(llegada, salida);
  const [habitaciones, ocupadas] = await Promise.all([
    obtenerHabitaciones(),
    Ocupacion.distinct("habitacion", { fecha: { $in: noches } }),
  ]);
  const idsOcupadas = new Set(ocupadas.map((id) => id.toString()));

  return habitaciones
    .filter((h) => h.capacidad >= huespedes && !idsOcupadas.has(h.id))
    .map((h) => ({ ...h, noches: noches.length, total: h.precioNoche * noches.length }));
}

// Sin 0/O ni 1/I para que el código no se confunda al dictarlo
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generarCodigo(): string {
  return "BS-" + Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

export type ResultadoReserva =
  | { ok: true; reserva: { codigo: string; habitacion: string; llegada: string; salida: string; noches: number; total: number; huespedes: number; estado: string; nombre: string } }
  | { ok: false; status: 404 | 409 | 422; mensaje: string };

/** Opciones que solo usa el panel del hotel. La web pública llama a crearReserva sin ellas. */
export type OpcionesCreacion = {
  estado?: "pendiente" | "confirmada";
  /** Quien crea la reserva desde el panel: queda en el historial */
  autor?: string;
  /** Precio por noche acordado; si no se indica, se usa el de la habitación */
  precioNoche?: number;
};

export async function crearReserva(datos: DatosReserva, opciones: OpcionesCreacion = {}): Promise<ResultadoReserva> {
  await conectarDB();
  // Asegura que el índice único exista antes de la primera reserva
  await Ocupacion.init();

  if (!Types.ObjectId.isValid(datos.habitacion)) {
    return { ok: false, status: 404, mensaje: "La habitación no existe" };
  }
  const habitacion = await Habitacion.findOne({ _id: datos.habitacion, activa: true }).lean();
  if (!habitacion) {
    return { ok: false, status: 404, mensaje: "La habitación no existe o no está disponible" };
  }
  if (datos.huespedes > habitacion.capacidad) {
    return {
      ok: false,
      status: 422,
      mensaje: `Esta habitación admite máximo ${habitacion.capacidad} ${habitacion.capacidad === 1 ? "persona" : "personas"}`,
    };
  }

  // El precio se calcula aquí, con el valor de la base de datos.
  // Nunca se confía en un total enviado desde el navegador.
  const noches = contarNoches(datos.llegada, datos.salida);
  const precioNoche = opciones.precioNoche ?? habitacion.precioNoche;
  const estado = opciones.estado ?? "pendiente";
  const reserva = await Reserva.create({
    codigo: generarCodigo(),
    habitacion: habitacion._id,
    nombreHabitacion: habitacion.nombre,
    precioNoche,
    llegada: datos.llegada,
    salida: datos.salida,
    noches,
    total: precioNoche * noches,
    huespedes: datos.huespedes,
    huesped: { nombre: datos.nombre, telefono: datos.telefono },
    notas: datos.notas,
    estado,
    historial: opciones.autor
      ? [{ evento: estado === "confirmada" ? "Reserva creada y confirmada por el hotel" : "Reserva creada por el hotel", fecha: new Date(), autor: opciones.autor }]
      : [],
  });

  // Bloquear cada noche. Si alguna ya está ocupada, el índice único lo rechaza
  // (error 11000) y deshacemos todo lo que alcanzamos a guardar.
  try {
    await Ocupacion.insertMany(
      nochesEntre(datos.llegada, datos.salida).map((fecha) => ({
        habitacion: habitacion._id,
        fecha,
        reserva: reserva._id,
      })),
      { ordered: true }
    );
  } catch (error) {
    await Promise.all([Ocupacion.deleteMany({ reserva: reserva._id }), Reserva.deleteOne({ _id: reserva._id })]);
    if ((error as { code?: number }).code === 11000) {
      return { ok: false, status: 409, mensaje: "La habitación ya no está disponible en esas fechas. Prueba con otras." };
    }
    throw error;
  }

  return {
    ok: true,
    reserva: {
      codigo: reserva.codigo,
      habitacion: reserva.nombreHabitacion,
      llegada: reserva.llegada,
      salida: reserva.salida,
      noches: reserva.noches,
      total: reserva.total,
      huespedes: reserva.huespedes,
      estado: reserva.estado,
      nombre: datos.nombre,
    },
  };
}

export type ReservaPublica = {
  codigo: string;
  habitacion: string;
  llegada: string;
  salida: string;
  noches: number;
  total: number;
  huespedes: number;
  estado: string;
  nombre: string;
};

/** Datos de una reserva para su página pública. No incluye el teléfono del huésped. */
export async function obtenerReservaPorCodigo(codigo: string): Promise<ReservaPublica | null> {
  if (!/^BS-[A-Z0-9]{6}$/.test(codigo)) return null;
  await conectarDB();
  const r = await Reserva.findOne({ codigo }).lean();
  if (!r) return null;
  return {
    codigo: r.codigo,
    habitacion: r.nombreHabitacion,
    llegada: r.llegada,
    salida: r.salida,
    noches: r.noches,
    total: r.total,
    huespedes: r.huespedes,
    estado: r.estado ?? "pendiente",
    nombre: r.huesped?.nombre ?? "",
  };
}
