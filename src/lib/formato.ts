const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 140000 → "$ 140.000" */
export const formatearPrecio = (valor: number) => pesos.format(valor);

/** 1 → "1 persona", 3 → "3 personas" */
export const personas = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;
