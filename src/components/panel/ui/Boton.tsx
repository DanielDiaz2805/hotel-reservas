import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro" | "whatsapp";
type Tamano = "sm" | "md";

const variantes: Record<Variante, string> = {
  primario: "bg-rio text-white hover:bg-rio-oscuro",
  secundario: "border border-linea bg-white text-tinta hover:border-rio hover:text-rio",
  peligro: "bg-red-600 text-white hover:bg-red-700",
  whatsapp: "bg-[#25D366] text-[#0b3d22] hover:bg-[#1ebe5a]",
};

const tamanos: Record<Tamano, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

/** Clases de un botón, para usarlas también en enlaces: <Link className={clasesBoton("primario")}> */
export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "md", extra = ""): string {
  return `relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variantes[variante]} ${tamanos[tamano]} ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  /** Muestra un indicador de carga y bloquea el botón mientras se procesa la acción */
  cargando?: boolean;
};

/** Botón del panel. Con `cargando` conserva su ancho y muestra un indicador, para que el clic tenga respuesta visible. */
export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton(variante, tamano, className)}
      {...resto}
    >
      <span className={`inline-flex items-center gap-1.5 ${cargando ? "invisible" : ""}`}>{children}</span>
      {cargando && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
