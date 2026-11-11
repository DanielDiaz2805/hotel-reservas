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
export const IconoInicio = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1v-9" /></svg>
);
export const IconoAjustes = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
);
export const IconoCheck = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></svg>
);
export const IconoAlerta = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.2v.01" /></svg>
);
export const IconoInfo = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.01" /></svg>
);
export const IconoCerrar = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconoReservas = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" /></svg>
);
export const IconoBuscar = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>
);
