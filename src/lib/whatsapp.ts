import { fechaCompleta } from "./fechas";
import { formatearPrecio } from "./formato";
import { horaLegible, type DatosHotel } from "./configuracion-reglas";

/**
 * Integración con WhatsApp mediante enlaces "click to chat" (wa.me).
 * Abren WhatsApp (app o web) con el mensaje ya escrito; la persona solo pulsa
 * enviar. Es gratuito y no requiere aprobación de Meta, a diferencia de la API
 * de WhatsApp Business, que es la evolución natural si el hotel crece.
 */

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
export function mensajeNuevaReserva(r: DatosMensajeReserva, urlReserva: string, hotel: DatosHotel): string {
  return [
    `Hola, ${hotel.nombre}. Acabo de solicitar esta reserva:`,
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
export function mensajeConfirmacion(r: DatosMensajeReserva, urlReserva: string, hotel: DatosHotel): string {
  const nombre = r.nombre.split(" ")[0];
  return [
    `Hola, ${nombre}. Tu reserva en ${hotel.nombre} está *confirmada*.`,
    "",
    detalleReserva(r),
    "",
    `El check-in es desde las ${horaLegible(hotel.checkIn)} y el check-out hasta las ${horaLegible(hotel.checkOut)}.`,
    `Detalle: ${urlReserva}`,
    "",
    "¡Te esperamos!",
  ].join("\n");
}

/** Mensaje que el hotel envía al huésped si cancela la reserva (paso 7). */
export function mensajeCancelacion(r: DatosMensajeReserva, hotel: DatosHotel): string {
  const nombre = r.nombre.split(" ")[0];
  return [
    `Hola, ${nombre}. Lamentamos informarte que no pudimos confirmar tu reserva *${r.codigo}* en ${hotel.nombre}.`,
    "",
    "Si quieres, te ayudamos a encontrar otras fechas u otra habitación.",
  ].join("\n");
}
