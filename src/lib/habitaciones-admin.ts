import { Types } from "mongoose";
import { conectarDB } from "./db";
import type { CambioHabitacion, DatosHabitacion, TipoHabitacion } from "./habitacion-reglas";
import { Habitacion } from "@/models/Habitacion";
import { Bloqueo } from "@/models/Bloqueo";
import { Ocupacion } from "@/models/Ocupacion";
import { Reserva } from "@/models/Reserva";

export type HabitacionAdmin = {
  id: string;
  slug: string;
  nombre: string;
  tipo: TipoHabitacion;
  descripcion: string;
  capacidad: number;
  camas: string;
  precioNoche: number;
  comodidades: string[];
  imagenes: string[];
  activa: boolean;
  /** Reservas pendientes, confirmadas o en casa cuya salida es hoy o después */
  reservasVigentes: number;
};

type Documento = {
  _id: Types.ObjectId;
  slug: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  capacidad: number;
  camas: string;
  precioNoche: number;
  comodidades?: string[];
  imagenes?: string[];
  activa?: boolean;
};

function aAdmin(d: Documento, reservasVigentes: number): HabitacionAdmin {
  return {
    id: d._id.toString(),
    slug: d.slug,
    nombre: d.nombre,
    tipo: d.tipo as TipoHabitacion,
    descripcion: d.descripcion,
    capacidad: d.capacidad,
    camas: d.camas,
    precioNoche: d.precioNoche,
    comodidades: d.comodidades ?? [],
    imagenes: d.imagenes ?? [],
    activa: d.activa ?? true,
    reservasVigentes,
  };
}

async function reservasVigentesPorHabitacion(hoy: string): Promise<Map<string, number>> {
  const grupos = await Reserva.aggregate<{ _id: Types.ObjectId; total: number }>([
    { $match: { estado: { $in: ["pendiente", "confirmada", "en_casa"] }, salida: { $gte: hoy } } },
    { $group: { _id: "$habitacion", total: { $sum: 1 } } },
  ]);
  return new Map(grupos.map((g) => [g._id.toString(), g.total]));
}

/** Todas las habitaciones, también las ocultas en la web. */
export async function listarHabitacionesAdmin(hoy: string): Promise<HabitacionAdmin[]> {
  await conectarDB();
  const [docs, vigentes] = await Promise.all([
    Habitacion.find().sort({ createdAt: 1 }).lean<Documento[]>(),
    reservasVigentesPorHabitacion(hoy),
  ]);
  return docs.map((d) => aAdmin(d, vigentes.get(d._id.toString()) ?? 0));
}

export async function obtenerHabitacionAdmin(id: string, hoy: string): Promise<HabitacionAdmin | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await conectarDB();
  const [doc, vigentes] = await Promise.all([Habitacion.findById(id).lean<Documento>(), reservasVigentesPorHabitacion(hoy)]);
  return doc ? aAdmin(doc, vigentes.get(doc._id.toString()) ?? 0) : null;
}

/** "Suite del Río" → "suite-del-rio" */
function slugificar(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "habitacion";
}

async function slugLibre(nombre: string): Promise<string> {
  const base = slugificar(nombre);
  for (let intento = 1; intento < 100; intento++) {
    const candidato = intento === 1 ? base : `${base}-${intento}`;
    if (!(await Habitacion.exists({ slug: candidato }))) return candidato;
  }
  return `${base}-${Date.now()}`;
}

export type ResultadoHabitacion =
  | { ok: true; habitacion: HabitacionAdmin }
  | { ok: false; status: 404 | 409; mensaje: string };

export async function crearHabitacion(datos: DatosHabitacion): Promise<ResultadoHabitacion> {
  await conectarDB();
  // El slug (la dirección web de la habitación) se fija al crearla y no cambia al editar el nombre,
  // para no romper enlaces que ya se hayan compartido.
  const slug = await slugLibre(datos.nombre);
  const doc = await Habitacion.create({ ...datos, slug });
  return { ok: true, habitacion: aAdmin(doc.toObject() as Documento, 0) };
}

export async function actualizarHabitacion(id: string, cambios: CambioHabitacion): Promise<ResultadoHabitacion> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La habitación no existe" };
  await conectarDB();
  const doc = await Habitacion.findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true }).lean<Documento>();
  if (!doc) return { ok: false, status: 404, mensaje: "La habitación no existe" };
  return { ok: true, habitacion: aAdmin(doc, 0) };
}

export type ResultadoEliminar = { ok: true } | { ok: false; status: 404 | 409; mensaje: string };

/** Solo se puede borrar una habitación que nunca tuvo reservas: las reservas guardan su historial. */
export async function eliminarHabitacion(id: string): Promise<ResultadoEliminar> {
  if (!Types.ObjectId.isValid(id)) return { ok: false, status: 404, mensaje: "La habitación no existe" };
  await conectarDB();
  if (await Reserva.exists({ habitacion: id })) {
    return {
      ok: false,
      status: 409,
      mensaje: "Esta habitación ya tiene reservas en su historial, así que no se puede borrar. Ocúltala de la web en su lugar.",
    };
  }
  // Sin reservas, lo único que puede quedar son bloqueos de fechas: se van con la habitación
  await Promise.all([Ocupacion.deleteMany({ habitacion: id }), Bloqueo.deleteMany({ habitacion: id })]);
  const borrada = await Habitacion.findByIdAndDelete(id);
  if (!borrada) return { ok: false, status: 404, mensaje: "La habitación no existe" };
  return { ok: true };
}
