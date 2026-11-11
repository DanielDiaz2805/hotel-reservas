import Link from "next/link";

/** Anterior / Siguiente con enlaces normales: funciona sin JavaScript y conserva los filtros. */
export function Paginacion({ pagina, paginas, ruta, consulta }: { pagina: number; paginas: number; ruta: string; consulta: Record<string, string> }) {
  if (paginas <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams(consulta);
    if (p > 1) params.set("pagina", String(p));
    const texto = params.toString();
    return texto ? `${ruta}?${texto}` : ruta;
  };
  const base = "rounded-full border border-linea bg-white px-4 py-2 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Páginas de resultados" className="mt-6 flex items-center justify-between gap-3">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={`${base} hover:border-rio hover:text-rio`}>
          ← Anterior
        </Link>
      ) : (
        <span className={`${base} opacity-40`}>← Anterior</span>
      )}
      <span className="text-sm text-niebla tabular-nums">
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas ? (
        <Link href={href(pagina + 1)} className={`${base} hover:border-rio hover:text-rio`}>
          Siguiente →
        </Link>
      ) : (
        <span className={`${base} opacity-40`}>Siguiente →</span>
      )}
    </nav>
  );
}
