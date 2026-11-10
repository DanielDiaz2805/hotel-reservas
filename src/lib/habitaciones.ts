import type { Types } from "mongoose";
import { conectarDB } from "./db";
import { Habitacion, type HabitacionDoc } from "@/models/Habitacion";

/**
 * Forma de una habitación tal como la usan las páginas y la API.
 * Convertimos el documento de MongoDB a un objeto simple: el _id pasa a ser
 * un texto `id` y se omiten campos internos que el público no necesita.
 */
export type HabitacionPublica = {
  id: string;
  nombre: string;
  slug: string;
  tipo: string;
  descripcion: string;
  capacidad: number;
  camas: string;
  precioNoche: number;
  comodidades: string[];
  imagenes: string[];
};

type HabitacionLean = HabitacionDoc & { _id: Types.ObjectId };

function aPublica(doc: HabitacionLean): HabitacionPublica {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    slug: doc.slug,
    tipo: doc.tipo,
    descripcion: doc.descripcion,
    capacidad: doc.capacidad,
    camas: doc.camas,
    precioNoche: doc.precioNoche,
    comodidades: doc.comodidades ?? [],
    imagenes: doc.imagenes ?? [],
  };
}

/** Habitaciones visibles en la web, de la más económica a la más costosa. */
export async function obtenerHabitaciones(): Promise<HabitacionPublica[]> {
  await conectarDB();
  const docs = await Habitacion.find({ activa: true }).sort({ precioNoche: 1 }).lean<HabitacionLean[]>();
  return docs.map(aPublica);
}

/** Una habitación por su slug, o null si no existe o está inactiva. */
export async function obtenerHabitacionPorSlug(slug: string): Promise<HabitacionPublica | null> {
  await conectarDB();
  const doc = await Habitacion.findOne({ slug, activa: true }).lean<HabitacionLean>();
  return doc ? aPublica(doc) : null;
}
