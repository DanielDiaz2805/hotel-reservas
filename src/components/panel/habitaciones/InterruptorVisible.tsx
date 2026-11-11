"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";

/** Interruptor para mostrar u ocultar una habitación en la web sin abrir el formulario. */
export function InterruptorVisible({
  id,
  nombre,
  activa,
  reservasVigentes,
}: {
  id: string;
  nombre: string;
  activa: boolean;
  reservasVigentes: number;
}) {
  const router = useRouter();
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    const nuevo = !activa;
    if (!nuevo && reservasVigentes > 0) {
      const seguro = await confirmar({
        titulo: `¿Ocultar ${nombre}?`,
        mensaje: `Tiene ${reservasVigentes} ${reservasVigentes === 1 ? "reserva vigente" : "reservas vigentes"}. Seguirán en pie, pero nadie más podrá reservarla mientras esté oculta.`,
        textoConfirmar: "Sí, ocultar",
        textoCancelar: "No, dejarla visible",
      });
      if (!seguro) return;
    }

    setCargando(true);
    try {
      const r = await fetch(`/api/panel/habitaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: nuevo }),
      });
      if (r.status === 401) {
        router.replace("/ingresar");
        return;
      }
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}));
        avisos.error(cuerpo.mensaje ?? "No se pudo actualizar la habitación");
        return;
      }
      if (nuevo) avisos.exito(`${nombre} ya es visible`, "Los huéspedes pueden verla y reservarla.");
      else avisos.exito(`${nombre} quedó oculta`, "Ya no aparece en la web.");
      router.refresh();
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={activa}
      aria-label={`${nombre}: visible en la web`}
      onClick={alternar}
      disabled={cargando}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 ${activa ? "bg-rio" : "bg-linea"}`}
    >
      <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${activa ? "translate-x-5" : ""}`} />
    </button>
  );
}
