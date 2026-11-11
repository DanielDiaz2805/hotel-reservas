"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservaAdmin } from "@/lib/panel";
import { enlaceWhatsApp, mensajeCancelacion, mensajeConfirmacion, normalizarNumero } from "@/lib/whatsapp";
import { IconoWhatsApp } from "@/components/IconoWhatsApp";
import { Boton } from "@/components/panel/ui/Boton";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";

type Accion = "confirmada" | "cancelada";

/** Botones para confirmar o cancelar una reserva y avisarle al huésped por WhatsApp. */
export function AccionesReserva({ reserva }: { reserva: ReservaAdmin }) {
  const router = useRouter();
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  // Guarda cuál acción está en curso para mostrar la carga solo en ese botón
  const [accion, setAccion] = useState<Accion | null>(null);

  async function cambiar(estado: Accion) {
    if (estado === "cancelada") {
      const seguro = await confirmar({
        titulo: `¿Cancelar la reserva ${reserva.codigo}?`,
        mensaje: `Las noches de ${reserva.nombre} quedarán libres para otros huéspedes. Una reserva cancelada no se puede reactivar.`,
        textoConfirmar: "Sí, cancelar reserva",
        textoCancelar: "No, mantenerla",
        peligro: true,
      });
      if (!seguro) return;
    }

    setAccion(estado);
    try {
      const r = await fetch(`/api/panel/reservas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (r.status === 401) {
        router.replace("/ingresar");
        return;
      }
      if (r.ok) {
        const nombre = reserva.nombre.split(" ")[0];
        if (estado === "confirmada") {
          avisos.exito(`Reserva ${reserva.codigo} confirmada`, `Ahora puedes avisarle a ${nombre} por WhatsApp.`);
        } else {
          avisos.exito(`Reserva ${reserva.codigo} cancelada`, "Las noches quedaron libres.");
        }
      } else {
        const cuerpo = await r.json().catch(() => ({}));
        avisos.error(cuerpo.mensaje ?? "No se pudo actualizar la reserva. Intenta de nuevo.");
      }
      // Vuelve a cargar los datos del servidor: la fila cambia de pestaña y el resumen se actualiza
      router.refresh();
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setAccion(null);
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

  const ocupado = accion !== null;
  return (
    <div className="flex gap-2 whitespace-nowrap">
      {reserva.estado === "pendiente" && (
        <Boton tamano="sm" onClick={() => cambiar("confirmada")} cargando={accion === "confirmada"} disabled={ocupado}>
          Confirmar
        </Boton>
      )}
      {reserva.estado !== "cancelada" && (
        <Boton tamano="sm" variante="secundario" onClick={() => cambiar("cancelada")} cargando={accion === "cancelada"} disabled={ocupado}>
          Cancelar
        </Boton>
      )}
      {reserva.estado !== "pendiente" && numero && (
        <Boton tamano="sm" variante="whatsapp" onClick={abrirWhatsApp}>
          <IconoWhatsApp className="h-3.5 w-3.5" />
          Avisar
        </Boton>
      )}
    </div>
  );
}
