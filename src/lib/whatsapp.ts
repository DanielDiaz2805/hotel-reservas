import { fechaCompleta } from "./fechas";
import { formatearPrecio } from "./formato";

/**
 * Integración con WhatsApp mediante enlaces "click to chat" (wa.me).
 * Abren WhatsApp (app o web) con el mensaje ya escrito; la persona solo pulsa
 * enviar. Es gratuito y no requiere aprobación de Meta, a diferencia de la API
 * de WhatsApp Business, que es la evolución natural si el hotel crece.
 */

/** Número del hotel con indicativo, solo dígitos (573001234567), o null si no está configurado. */
export function numeroHotel(): string | null {
  return normalizarNumero(process.env.WHATSAPP_HOTEL ?? "");
}

/** "300 123 4567" o "+57 300-123-4567" → "573001234567". Devuelve null si no es un celular colombiano. */
export function normalizarNumero(numero: string): string | null {
  const digitos = numero.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
  return /^3\d{9}$/.test(digitos) ? `57${digitos}` : null;
}

export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export type DatosMensajeReserva = {
  codigo: string;
  habitacion: string;
  llegada: string;
  salida: string;
  noches: number;
  huespedes: number;
  total: number;
  nombre: string;
};

const detalleReserva = (r: DatosMensajeReserva) =>
  [
    `*Código:* ${r.codigo}`,
    `*Habitación:* ${r.habitacion}`,
    `*Llegada:* ${fechaCompleta(r.llegada)}`,
    `*Salida:* ${fechaCompleta(r.salida)}`,
    `*Huéspedes:* ${r.huespedes}`,
    `*Total:* ${formatearPrecio(r.total)} (${r.noches} ${r.noches === 1 ? "noche" : "noches"})`,
  ].join("\n");

/** Mensaje que el huésped envía al hotel después de reservar. */
export function mensajeNuevaReserva(r: DatosMensajeReserva, urlReserva: string): string {
  return [
    "Hola, Hotel Brisas del Sinú. Acabo de solicitar esta reserva:",
    "",
    detalleReserva(r),
    `*A nombre de:* ${r.nombre}`,
    "",
    `Detalle: ${urlReserva}`,
    "",
    "¿Me la pueden confirmar, por favor?",
  ].join("\n");
}

/** Mensaje que el hotel envía al huésped al confirmar (lo usará el panel en el paso 7). */
export function mensajeConfirmacion(r: DatosMensajeReserva, urlReserva: string): string {
  const nombre = r.nombre.split(" ")[0];
  return [
    `Hola, ${nombre}. Tu reserva en el Hotel Brisas del Sinú está *confirmada*.`,
    "",
    detalleReserva(r),
    "",
    "El check-in es desde las 3:00 p. m. y el check-out hasta las 12:00 m.",
    `Detalle: ${urlReserva}`,
    "",
    "¡Te esperamos!",
  ].join("\n");
}

/** Mensaje que el hotel envía al huésped si cancela la reserva (paso 7). */
export function mensajeCancelacion(r: DatosMensajeReserva): string {
  const nombre = r.nombre.split(" ")[0];
  return [
    `Hola, ${nombre}. Lamentamos informarte que no pudimos confirmar tu reserva *${r.codigo}* en el Hotel Brisas del Sinú.`,
    "",
    "Si quieres, te ayudamos a encontrar otras fechas u otra habitación.",
  ].join("\n");
}
