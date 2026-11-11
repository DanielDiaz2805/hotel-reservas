"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconoBuscar, IconoCerrar } from "@/components/panel/Iconos";

export type ValoresFiltro = { q: string; estado: string; habitacion: string; desde: string; hasta: string };

const PESTANAS = [
  { id: "activas", texto: "Activas" },
  { id: "pendiente", texto: "Pendientes" },
  { id: "confirmada", texto: "Confirmadas" },
  { id: "en_casa", texto: "En casa" },
  { id: "finalizada", texto: "Finalizadas" },
  { id: "cancelada", texto: "Canceladas" },
  { id: "todas", texto: "Todas" },
];

/** Dirección con los filtros que tienen valor. "Activas" es lo normal, así que no se escribe. */
function construirUrl(v: ValoresFiltro): string {
  const params = new URLSearchParams();
  if (v.q.trim()) params.set("q", v.q.trim());
  if (v.estado && v.estado !== "activas") params.set("estado", v.estado);
  if (v.habitacion) params.set("habitacion", v.habitacion);
  if (v.desde) params.set("desde", v.desde);
  if (v.hasta) params.set("hasta", v.hasta);
  const texto = params.toString();
  return texto ? `/panel/reservas?${texto}` : "/panel/reservas";
}

const campo =
  "rounded-xl border border-linea bg-white px-3.5 py-2.5 text-sm transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none";

export function FiltrosReservas({
  valores,
  habitaciones,
  conteos,
}: {
  valores: ValoresFiltro;
  habitaciones: { id: string; nombre: string }[];
  conteos: Record<string, number>;
}) {
  const router = useRouter();
  const [buscando, empezar] = useTransition();
  const [texto, setTexto] = useState(valores.q);

  // Busca sola 400 ms después de que dejas de escribir
  useEffect(() => {
    if (texto.trim() === valores.q.trim()) return;
    const espera = setTimeout(() => empezar(() => router.push(construirUrl({ ...valores, q: texto }))), 400);
    return () => clearTimeout(espera);
  }, [texto, valores, router]);

  const ir = (cambios: Partial<ValoresFiltro>) => empezar(() => router.push(construirUrl({ ...valores, q: texto, ...cambios })));
  const hayFiltros = Boolean(texto.trim() || valores.habitacion || valores.desde || valores.hasta);

  return (
    <div className="space-y-4">
      <div className="relative">
        <IconoBuscar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-niebla" />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre, código o teléfono"
          aria-label="Buscar reservas"
          className={`${campo} w-full py-3 pl-12 pr-11`}
        />
        {buscando ? (
          <span aria-hidden className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-rio/30 border-t-rio" />
        ) : (
          texto && (
            <button
              type="button"
              onClick={() => setTexto("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-niebla hover:bg-papel hover:text-tinta"
            >
              <IconoCerrar className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Pestañas de estado: se deslizan hacia los lados en el celular */}
      <nav aria-label="Filtrar por estado" className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1 rounded-full border border-linea bg-white p-1">
          {PESTANAS.map((p) => {
            const activa = p.id === valores.estado;
            return (
              <li key={p.id}>
                <Link
                  href={construirUrl({ ...valores, q: texto, estado: p.id })}
                  aria-current={activa ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activa ? "bg-rio text-white shadow-md" : "text-niebla hover:bg-papel hover:text-tinta"
                  }`}
                >
                  {p.texto}
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${activa ? "bg-white/20" : "bg-papel"}`}>{conteos[p.id] ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-niebla">
          Habitación
          <select value={valores.habitacion} onChange={(e) => ir({ habitacion: e.target.value })} className={`${campo} mt-1 block min-w-44`}>
            <option value="">Todas</option>
            {habitaciones.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-niebla">
          Llegada desde
          <input type="date" value={valores.desde} max={valores.hasta || undefined} onChange={(e) => ir({ desde: e.target.value })} className={`${campo} mt-1 block`} />
        </label>
        <label className="text-xs font-medium text-niebla">
          Llegada hasta
          <input type="date" value={valores.hasta} min={valores.desde || undefined} onChange={(e) => ir({ hasta: e.target.value })} className={`${campo} mt-1 block`} />
        </label>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setTexto("");
              empezar(() => router.push(construirUrl({ q: "", estado: valores.estado, habitacion: "", desde: "", hasta: "" })));
            }}
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-rio underline-offset-4 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
