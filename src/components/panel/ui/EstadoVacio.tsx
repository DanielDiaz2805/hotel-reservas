import type { ReactNode } from "react";

/** Pantalla vacía que explica qué pasa y, si hace falta, qué hacer a continuación. */
export function EstadoVacio({
  titulo,
  descripcion,
  icono,
  children,
}: {
  titulo: string;
  descripcion?: string;
  icono?: ReactNode;
  /** Acción sugerida, por ejemplo un botón para crear el primer elemento */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-linea bg-white/60 px-6 py-12 text-center animate-aparecer">
      {icono && <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rio/10 text-rio">{icono}</span>}
      <p className="font-display text-lg font-semibold">{titulo}</p>
      {descripcion && <p className="mx-auto mt-1 max-w-sm text-niebla">{descripcion}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}
