const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 140000 → "$ 140.000" */
export const formatearPrecio = (valor: number) => pesos.format(valor);

/** 1 → "1 persona", 3 → "3 personas" */
export const personas = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;

const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

/** "2026-11-11T20:45:00Z" → "11 nov, 3:45 p. m." (hora de Colombia) */
export const fechaHora = (iso: string) => formatoFechaHora.format(new Date(iso));
