import { z } from "zod";

/**
 * Reglas de una habitación. Sin dependencias del servidor: las usan tanto el formulario
 * del panel (para avisar mientras se escribe) como la API (que es quien manda).
 */

export const TIPOS = [
  { valor: "sencilla", texto: "Sencilla" },
  { valor: "doble", texto: "Doble" },
  { valor: "familiar", texto: "Familiar" },
  { valor: "suite", texto: "Suite" },
] as const;
export type TipoHabitacion = (typeof TIPOS)[number]["valor"];

export const LIMITES = {
  nombre: { min: 3, max: 60 },
  descripcion: { min: 20, max: 600 },
  camas: { min: 3, max: 60 },
  capacidad: { min: 1, max: 10 },
  precio: { min: 10_000, max: 10_000_000 },
  fotos: 8,
  comodidades: 20,
  largoComodidad: 40,
} as const;

export const COMODIDADES_SUGERIDAS = [
  "Aire acondicionado",
  "Ventilador",
  "Wi-Fi",
  "TV",
  "Baño privado",
  "Agua caliente",
  "Minibar",
  "Nevera",
  "Escritorio",
  "Balcón",
  "Vista al jardín",
  "Acceso a la piscina",
  "Desayuno incluido",
  "Parqueadero",
] as const;

/** Las fotos solo pueden venir de Cloudinary. La API además verifica que sea nuestra cuenta. */
export const PREFIJO_FOTO = "https://res.cloudinary.com/";

const sinRepetidos = (lista: string[]) => {
  const vistos = new Set<string>();
  return lista.filter((item) => {
    const clave = item.toLowerCase();
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
};

export const esquemaHabitacion = z.object({
  nombre: z
    .string()
    .trim()
    .min(LIMITES.nombre.min, `El nombre debe tener al menos ${LIMITES.nombre.min} letras`)
    .max(LIMITES.nombre.max, `El nombre admite máximo ${LIMITES.nombre.max} caracteres`),
  tipo: z.enum(["sencilla", "doble", "familiar", "suite"], "Elige un tipo de habitación"),
  descripcion: z
    .string()
    .trim()
    .min(LIMITES.descripcion.min, `Cuéntale al huésped un poco más: mínimo ${LIMITES.descripcion.min} caracteres`)
    .max(LIMITES.descripcion.max, `La descripción admite máximo ${LIMITES.descripcion.max} caracteres`),
  capacidad: z
    .number()
    .int("La capacidad debe ser un número entero")
    .min(LIMITES.capacidad.min, "Mínimo 1 persona")
    .max(LIMITES.capacidad.max, `Máximo ${LIMITES.capacidad.max} personas`),
  camas: z
    .string()
    .trim()
    .min(LIMITES.camas.min, "Describe las camas, por ejemplo: 1 cama doble")
    .max(LIMITES.camas.max, `Máximo ${LIMITES.camas.max} caracteres`),
  precioNoche: z
    .number("Escribe el precio por noche")
    .int("El precio debe ser un número entero")
    .min(LIMITES.precio.min, "El precio por noche parece muy bajo")
    .max(LIMITES.precio.max, "El precio por noche parece muy alto"),
  comodidades: z
    .array(z.string().trim().min(1).max(LIMITES.largoComodidad, `Cada comodidad admite máximo ${LIMITES.largoComodidad} caracteres`))
    .max(LIMITES.comodidades, `Máximo ${LIMITES.comodidades} comodidades`)
    .transform(sinRepetidos),
  imagenes: z
    .array(z.string().startsWith(PREFIJO_FOTO, "Una de las fotos no es válida"))
    .max(LIMITES.fotos, `Máximo ${LIMITES.fotos} fotos`),
  activa: z.boolean(),
});

export type DatosHabitacion = z.infer<typeof esquemaHabitacion>;
export const esquemaCambioHabitacion = esquemaHabitacion.partial();
export type CambioHabitacion = z.infer<typeof esquemaCambioHabitacion>;
