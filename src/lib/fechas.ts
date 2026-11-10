/**
 * Las fechas de una reserva son días del calendario, no instantes en el tiempo.
 * Por eso se manejan como texto "AAAA-MM-DD": así se evitan los errores de zona
 * horaria (una reserva para el 15 que aparece el 14 por la diferencia con UTC).
 */
export const ZONA_HOTEL = "America/Bogota";
export const MAX_NOCHES = 30;

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de hoy en Colombia, en formato AAAA-MM-DD. */
export function hoyEnColombia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HOTEL }).format(new Date());
}

/** true si el texto es una fecha real del calendario (rechaza "2026-02-30"). */
export function esFechaValida(texto: string): boolean {
  if (!FORMATO_FECHA.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(texto);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Noches entre llegada y salida: del 10 al 13 son 3 noches. */
export function contarNoches(llegada: string, salida: string): number {
  const ms = new Date(`${salida}T00:00:00Z`).getTime() - new Date(`${llegada}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Cada noche ocupada: del 10 al 13 → ["…-10", "…-11", "…-12"]. El día de salida queda libre. */
export function nochesEntre(llegada: string, salida: string): string[] {
  return Array.from({ length: contarNoches(llegada, salida) }, (_, i) => sumarDias(llegada, i));
}

const formatoLargo = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "2026-12-15" → "mar, 15 dic" */
export const fechaLegible = (fecha: string) => formatoLargo.format(new Date(`${fecha}T00:00:00Z`));

const formatoCompleto = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-12-15" → "martes, 15 de diciembre de 2026" */
export const fechaCompleta = (fecha: string) => formatoCompleto.format(new Date(`${fecha}T00:00:00Z`));
