"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservaAdmin } from "@/lib/panel";
import { fechaLegible } from "@/lib/fechas";
import { enlaceWhatsApp, mensajeCancelacion, mensajeConfirmacion, normalizarNumero } from "@/lib/whatsapp";
import { IconoWhatsApp } from "@/components/IconoWhatsApp";
import { Boton } from "@/components/panel/ui/Boton";
import { useHotel } from "@/components/panel/ui/ContextoHotel";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";

type Accion = "confirmada" | "en_casa" | "finalizada" | "cancelada";

type Props = {
  reserva: ReservaAdmin;
  /** Fecha de hoy en Colombia (AAAA-MM-DD): el check-in solo se habilita desde el día de llegada */
  hoy: string;
  /** Muestra solo la acción principal del momento (para las listas del inicio) */
  compacto?: boolean;
  tamano?: "sm" | "md";
};

/**
 * Botones de una reserva según su estado:
 * pendiente → Confirmar | confirmada → Check-in | en casa → Check-out, además de Cancelar y Avisar.
 */
export function AccionesReserva({ reserva, hoy, compacto = false, tamano = "sm" }: Props) {
  const router = useRouter();
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const hotel = useHotel();
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
    if (estado === "finalizada" && reserva.salida > hoy) {
      const seguro = await confirmar({
        titulo: `¿Registrar la salida de ${reserva.nombre.split(" ")[0]}?`,
        mensaje: `La reserva era hasta el ${fechaLegible(reserva.salida)}. Las noches que ya no usará quedarán libres para otros huéspedes.`,
        textoConfirmar: "Sí, registrar salida",
        textoCancelar: "Todavía no",
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
        if (estado === "confirmada") avisos.exito(`Reserva ${reserva.codigo} confirmada`, `Ahora puedes avisarle a ${nombre} por WhatsApp.`);
        else if (estado === "en_casa") avisos.exito("Check-in registrado", `${nombre} ya está en ${reserva.habitacion}.`);
        else if (estado === "finalizada") avisos.exito("Check-out registrado", `La estadía de ${nombre} quedó finalizada.`);
        else avisos.exito(`Reserva ${reserva.codigo} cancelada`, "Las noches quedaron libres.");
      } else {
        const cuerpo = await r.json().catch(() => ({}));
        avisos.error(cuerpo.mensaje ?? "No se pudo actualizar la reserva. Intenta de nuevo.");
      }
      // Vuelve a cargar los datos del servidor: la reserva cambia de estado y el resumen se actualiza
      router.refresh();
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setAccion(null);
    }
  }

  const numero = normalizarNumero(reserva.telefono);
  const abrirWhatsApp = () => {
    if (!numero) return;
    const mensaje =
      reserva.estado === "cancelada"
        ? mensajeCancelacion(reserva, hotel)
        : mensajeConfirmacion(reserva, `${window.location.origin}/reservas/${reserva.codigo}`, hotel);
    window.open(enlaceWhatsApp(numero, mensaje), "_blank", "noopener,noreferrer");
  };

  const ocupado = accion !== null;
  const puedeCheckIn = reserva.llegada <= hoy;
  const botonCheckIn = (
    <Boton
      key="checkin"
      tamano={tamano}
      onClick={() => cambiar("en_casa")}
      cargando={accion === "en_casa"}
      disabled={ocupado || !puedeCheckIn}
      title={puedeCheckIn ? undefined : `Disponible desde el ${fechaLegible(reserva.llegada)}`}
    >
      Check-in
    </Boton>
  );
  const botonCheckOut = (
    <Boton key="checkout" tamano={tamano} onClick={() => cambiar("finalizada")} cargando={accion === "finalizada"} disabled={ocupado}>
      Check-out
    </Boton>
  );
  const botonConfirmar = (
    <Boton key="confirmar" tamano={tamano} onClick={() => cambiar("confirmada")} cargando={accion === "confirmada"} disabled={ocupado}>
      Confirmar
    </Boton>
  );
  const botonCancelar = (
    <Boton key="cancelar" tamano={tamano} variante="secundario" onClick={() => cambiar("cancelada")} cargando={accion === "cancelada"} disabled={ocupado}>
      Cancelar
    </Boton>
  );
  const botonAvisar = numero ? (
    <Boton key="avisar" tamano={tamano} variante="whatsapp" onClick={abrirWhatsApp}>
      <IconoWhatsApp className="h-3.5 w-3.5" />
      Avisar
    </Boton>
  ) : null;

  const botones =
    reserva.estado === "pendiente"
      ? compacto ? [botonConfirmar] : [botonConfirmar, botonCancelar]
      : reserva.estado === "confirmada"
        ? compacto ? [botonCheckIn] : [botonCheckIn, botonCancelar, botonAvisar]
        : reserva.estado === "en_casa"
          ? [botonCheckOut]
          : reserva.estado === "cancelada" && !compacto
            ? [botonAvisar]
            : [];

  if (botones.filter(Boolean).length === 0) {
    return compacto ? null : <span className="text-sm text-niebla">Sin acciones pendientes</span>;
  }
  return <div className="flex flex-wrap gap-2 whitespace-nowrap">{botones}</div>;
}
