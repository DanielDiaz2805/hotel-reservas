"use client";
import { useState } from "react";
import type { NotaInterna } from "@/lib/panel";
import { fechaHora } from "@/lib/formato";
import { IconoCerrar } from "@/components/panel/Iconos";
import { Boton } from "@/components/panel/ui/Boton";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";

/** Notas del personal sobre una reserva ("pidió cuna", "llega tarde"). El huésped nunca las ve. */
export function NotasInternas({ reservaId, iniciales }: { reservaId: string; iniciales: NotaInterna[] }) {
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const [notas, setNotas] = useState(iniciales);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setGuardando(true);
    try {
      const r = await fetch(`/api/panel/reservas/${reservaId}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        avisos.error(cuerpo.mensaje ?? "No se pudo guardar la nota");
        return;
      }
      setNotas(cuerpo.notas);
      setTexto("");
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(nota: NotaInterna) {
    const seguro = await confirmar({
      titulo: "¿Borrar esta nota?",
      mensaje: `“${nota.texto.length > 90 ? nota.texto.slice(0, 90) + "…" : nota.texto}”`,
      textoConfirmar: "Sí, borrar",
      textoCancelar: "No, conservarla",
      peligro: true,
    });
    if (!seguro) return;
    try {
      const r = await fetch(`/api/panel/reservas/${reservaId}/notas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaId: nota.id }),
      });
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        avisos.error(cuerpo.mensaje ?? "No se pudo borrar la nota");
        return;
      }
      setNotas(cuerpo.notas);
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    }
  }

  return (
    <div>
      <form onSubmit={agregar}>
        <label htmlFor="nota-interna" className="sr-only">
          Nueva nota interna
        </label>
        <textarea
          id="nota-interna"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ej.: Pidió cuna. Llega tarde, después de las 9 p. m."
          className="w-full resize-y rounded-xl border border-linea bg-white px-4 py-3 text-sm transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-niebla tabular-nums">{texto.length} / 500</span>
          <Boton type="submit" tamano="sm" cargando={guardando} disabled={!texto.trim()}>
            Guardar nota
          </Boton>
        </div>
      </form>

      {notas.length === 0 ? (
        <p className="mt-5 text-sm text-niebla">Aún no hay notas. Aquí guardas lo que el equipo necesita recordar de esta reserva.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {[...notas].reverse().map((n) => (
            <li key={n.id} className="group relative rounded-2xl bg-papel px-4 py-3 pr-10 animate-escala">
              <p className="whitespace-pre-line text-sm">{n.texto}</p>
              <p className="mt-1.5 text-xs text-niebla">
                {n.autor ? `${n.autor}, ` : ""}
                {fechaHora(n.fecha)}
              </p>
              <button
                type="button"
                onClick={() => borrar(n)}
                aria-label="Borrar nota"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-niebla transition-colors hover:bg-white hover:text-red-700"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
