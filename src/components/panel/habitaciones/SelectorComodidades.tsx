"use client";
import { useState } from "react";
import { COMODIDADES_SUGERIDAS, LIMITES } from "@/lib/habitacion-reglas";
import { IconoCerrar } from "@/components/panel/Iconos";

/** Comodidades como etiquetas: se tocan las sugeridas o se escribe una propia y se pulsa Enter. */
export function SelectorComodidades({ valor, onChange }: { valor: string[]; onChange: (nuevo: string[]) => void }) {
  const [texto, setTexto] = useState("");
  const sugeridas: readonly string[] = COMODIDADES_SUGERIDAS;
  const propias = valor.filter((c) => !sugeridas.includes(c));
  const llena = valor.length >= LIMITES.comodidades;

  function alternar(comodidad: string) {
    if (valor.includes(comodidad)) onChange(valor.filter((c) => c !== comodidad));
    else if (!llena) onChange([...valor, comodidad]);
  }

  function agregarPropia() {
    const limpia = texto.trim().slice(0, LIMITES.largoComodidad);
    if (!limpia || llena) return;
    if (!valor.some((c) => c.toLowerCase() === limpia.toLowerCase())) onChange([...valor, limpia]);
    setTexto("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {sugeridas.map((c) => {
          const activa = valor.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={activa}
              onClick={() => alternar(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                activa ? "border-rio bg-rio text-white" : "border-linea bg-white text-tinta hover:border-rio hover:text-rio"
              }`}
            >
              {activa && <span aria-hidden>✓ </span>}
              {c}
            </button>
          );
        })}
        {propias.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full border border-sol bg-sol/15 py-1 pl-3.5 pr-1.5 text-sm font-medium animate-escala">
            {c}
            <button
              type="button"
              onClick={() => alternar(c)}
              aria-label={`Quitar ${c}`}
              className="grid h-6 w-6 place-items-center rounded-full hover:bg-sol/30"
            >
              <IconoCerrar className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              agregarPropia();
            }
          }}
          maxLength={LIMITES.largoComodidad}
          disabled={llena}
          placeholder={llena ? "Llegaste al máximo de comodidades" : "¿Falta alguna? Escríbela y pulsa Enter"}
          aria-label="Agregar otra comodidad"
          className="min-w-0 flex-1 rounded-xl border border-linea bg-white px-4 py-2.5 text-sm transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={agregarPropia}
          disabled={!texto.trim() || llena}
          className="rounded-xl border border-linea bg-white px-4 text-sm font-semibold transition-colors hover:border-rio hover:text-rio disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
      <p className="mt-2 text-xs text-niebla">
        {valor.length} de {LIMITES.comodidades} comodidades
      </p>
    </div>
  );
}
