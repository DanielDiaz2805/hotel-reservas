"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservaAdmin } from "@/lib/panel";
import { enlaceWhatsApp, mensajeCancelacion, mensajeConfirmacion, normalizarNumero } from "@/lib/whatsapp";
import { IconoWhatsApp } from "@/components/IconoWhatsApp";

/** Botones para confirmar o cancelar una reserva y avisarle al huésped por WhatsApp. */
export function AccionesReserva({ reserva }: { reserva: ReservaAdmin }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function cambiar(estado: "confirmada" | "cancelada") {
    if (
      estado === "cancelada" &&
      !window.confirm(`¿Cancelar la reserva ${reserva.codigo} de ${reserva.nombre}? Sus noches quedarán libres.`)
    ) {
      return;
    }
    setOcupado(true);
    setError("");
    try {
      const r = await fetch(`/api/panel/reservas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (r.status === 401) return router.replace("/ingresar");
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}));
        setError(cuerpo.mensaje ?? "No se pudo actualizar");
      }
      // Vuelve a cargar los datos del servidor: la fila cambia de pestaña y el resumen se actualiza
      router.refresh();
    } catch {
      setError("Sin conexión");
    } finally {
      setOcupado(false);
    }
  }

  const numero = normalizarNumero(reserva.telefono);
  const enlaceDetalle = () => `${window.location.origin}/reservas/${reserva.codigo}`;
  const abrirWhatsApp = () => {
    if (!numero) return;
    const mensaje =
      reserva.estado === "cancelada" ? mensajeCancelacion(reserva) : mensajeConfirmacion(reserva, enlaceDetalle());
    window.open(enlaceWhatsApp(numero, mensaje), "_blank", "noopener,noreferrer");
  };

  const boton =
    "rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50";
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-2 whitespace-nowrap">
        {reserva.estado === "pendiente" && (
          <button onClick={() => cambiar("confirmada")} disabled={ocupado} className={`${boton} bg-rio text-white hover:bg-rio-oscuro`}>
            Confirmar
          </button>
        )}
        {reserva.estado !== "cancelada" && (
          <button
            onClick={() => cambiar("cancelada")}
            disabled={ocupado}
            className={`${boton} border border-linea hover:border-red-300 hover:text-red-700`}
          >
            Cancelar
          </button>
        )}
        {reserva.estado !== "pendiente" && numero && (
          <button onClick={abrirWhatsApp} className={`${boton} inline-flex items-center gap-1.5 bg-[#25D366] text-[#0b3d22] hover:bg-[#1ebe5a]`}>
            <IconoWhatsApp className="h-3.5 w-3.5" />
            Avisar
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
