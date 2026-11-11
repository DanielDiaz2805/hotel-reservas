import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hoyEnColombia, sumarDias } from "@/lib/fechas";
import { obtenerReservaAdmin } from "@/lib/panel";
import { FormularioReservaPanel } from "@/components/panel/reservas/FormularioReservaPanel";
import { clasesBoton } from "@/components/panel/ui/Boton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Modificar reserva" };

export default async function EditarReserva({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await obtenerReservaAdmin(id);
  if (!r) notFound();
  const hoy = hoyEnColombia();
  const editable = r.estado === "pendiente" || r.estado === "confirmada";

  return (
    <>
      <Link href={`/panel/reservas/${r.id}`} className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Reserva {r.codigo}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold animate-subir">Modificar reserva</h1>
      {editable ? (
        <>
          <p className="mt-1 text-niebla">
            Cambia fechas, habitación, huéspedes o precio de {r.nombre}. Queda anotado en el historial.
          </p>
          <div className="mt-8">
            <FormularioReservaPanel reserva={r} hoy={hoy} manana={sumarDias(hoy, 1)} />
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-3xl border border-linea bg-white p-8 text-center">
          <p className="font-display text-lg font-semibold">Esta reserva ya no se puede modificar</p>
          <p className="mt-1 text-niebla">Solo se modifican las reservas pendientes o confirmadas.</p>
          <Link href={`/panel/reservas/${r.id}`} className={`${clasesBoton("secundario")} mt-5`}>
            Volver a la reserva
          </Link>
        </div>
      )}
    </>
  );
}
