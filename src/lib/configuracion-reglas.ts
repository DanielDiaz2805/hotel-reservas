import { z } from "zod";

/**
 * Datos del hotel que se editan desde el panel. Este archivo no toca la base de datos,
 * así que lo pueden importar tanto el servidor como las pantallas del navegador.
 */

export type ConfiguracionHotel = {
  nombre: string;
  /** Versión corta para encabezados y menús */
  nombreCorto: string;
  ciudad: string;
  /** Celular de WhatsApp con indicativo (573001234567), o null si no hay */
  whatsapp: string | null;
  /** Hora en formato 24 h "15:00" */
  checkIn: string;
  checkOut: string;
  tituloPrincipal: string;
  descripcionPrincipal: string;
  notaPie: string;
};

/** Lo que ven los huéspedes mientras el hotel no ha personalizado nada. */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionHotel = {
  nombre: "Hotel Brisas del Sinú",
  nombreCorto: "Brisas del Sinú",
  ciudad: "Montería, Córdoba",
  whatsapp: null,
  checkIn: "15:00",
  checkOut: "12:00",
  tituloPrincipal: "Descansa a pocas cuadras del río Sinú",
  descripcionPrincipal: "Elige tus fechas, mira qué habitaciones están libres y confirma tu reserva por WhatsApp, sin esperas ni llamadas.",
  notaPie: "",
};

export const LIMITES_CONFIGURACION = {
  nombre: 60,
  nombreCorto: 30,
  ciudad: 60,
  titulo: 90,
  descripcion: 220,
  notaPie: 120,
};

/** Datos mínimos que necesitan los mensajes de WhatsApp. */
export type DatosHotel = Pick<ConfiguracionHotel, "nombre" | "checkIn" | "checkOut">;

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elige una hora válida");

export const configuracionSchema = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre del hotel").max(LIMITES_CONFIGURACION.nombre, `Máximo ${LIMITES_CONFIGURACION.nombre} caracteres`),
  nombreCorto: z.string().trim().min(2, "Escribe un nombre corto").max(LIMITES_CONFIGURACION.nombreCorto, `Máximo ${LIMITES_CONFIGURACION.nombreCorto} caracteres`),
  ciudad: z.string().trim().min(2, "Escribe la ciudad").max(LIMITES_CONFIGURACION.ciudad, `Máximo ${LIMITES_CONFIGURACION.ciudad} caracteres`),
  // Vacío = sin botón de WhatsApp. Si se escribe, debe ser un celular colombiano.
  whatsapp: z
    .string()
    .transform((t) => t.replace(/[\s-]/g, "").replace(/^\+?57/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^3\d{9}$/, "Escribe un celular colombiano de 10 dígitos, por ejemplo 3001234567")])),
  checkIn: hora,
  checkOut: hora,
  tituloPrincipal: z.string().trim().min(5, "Escribe un título para la página principal").max(LIMITES_CONFIGURACION.titulo, `Máximo ${LIMITES_CONFIGURACION.titulo} caracteres`),
  descripcionPrincipal: z.string().trim().min(10, "Escribe una descripción corta").max(LIMITES_CONFIGURACION.descripcion, `Máximo ${LIMITES_CONFIGURACION.descripcion} caracteres`),
  notaPie: z.string().trim().max(LIMITES_CONFIGURACION.notaPie, `Máximo ${LIMITES_CONFIGURACION.notaPie} caracteres`).optional().default(""),
});

export type DatosConfiguracion = z.infer<typeof configuracionSchema>;

/** "Brisas del Sinú" → "BS". Se usa como logo cuando el hotel no tiene uno. */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .replace(/^hotel\s+/i, "")
    .split(/\s+/)
    .filter((p) => !/^(de|del|la|las|los|el|y|en)$/i.test(p));
  const letras = palabras.slice(0, 2).map((p) => p[0]);
  return (letras.join("") || nombre.slice(0, 2)).toUpperCase();
}

/** "15:00" → "3:00 p. m.", "12:00" → "12:00 m." */
export function horaLegible(valor: string): string {
  const [h, m] = valor.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00 m.";
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}
