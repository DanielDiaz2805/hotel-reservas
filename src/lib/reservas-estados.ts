/** Estados de una reserva. Archivo sin dependencias del servidor: lo usan la base de datos, la API y las pantallas. */
export const ESTADOS = ["pendiente", "confirmada", "en_casa", "finalizada", "cancelada"] as const;
export type EstadoReserva = (typeof ESTADOS)[number];

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_casa: "En casa",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

/** Reservas que siguen vivas: todavía requieren atención del hotel. */
export const ESTADOS_ACTIVOS: readonly EstadoReserva[] = ["pendiente", "confirmada", "en_casa"];

export const esEstado = (valor: unknown): valor is EstadoReserva =>
  typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
