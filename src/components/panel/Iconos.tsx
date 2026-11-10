type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
export const IconoLlegada = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
);
export const IconoSalida = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconoReloj = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconoCama = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3h-8v8M3 14h18M7 10.5a1.5 1.5 0 1 0 0-.01" /></svg>
);
