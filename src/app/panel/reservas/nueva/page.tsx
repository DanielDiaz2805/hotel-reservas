import type { Metadata } from "next";
import Link from "next/link";
import { hoyEnColombia, sumarDias } from "@/lib/fechas";
import { FormularioReservaPanel } from "@/components/panel/reservas/FormularioReservaPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva reserva" };

export default function NuevaReserva() {
  const hoy = hoyEnColombia();
  return (
    <>
      <Link href="/panel/reservas" className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Reservas
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold animate-subir">Nueva reserva</h1>
      <p className="mt-1 text-niebla">Para huéspedes que reservan por llamada, WhatsApp o en el mostrador.</p>
      <div className="mt-8">
        <FormularioReservaPanel hoy={hoy} manana={sumarDias(hoy, 1)} />
      </div>
    </>
  );
}
