import Link from "next/link";
import { telefonoLegible, type ReservaAdmin } from "@/lib/panel";
import { fechaLegible } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/formato";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { InsigniaEstado } from "@/components/panel/reservas/InsigniaEstado";

/** Reserva en formato de tarjeta: la forma cómoda de leerla en el celular. */
export function TarjetaReserva({ r, hoy }: { r: ReservaAdmin; hoy: string }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-linea bg-white p-5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(13,58,49,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/panel/reservas/${r.id}`} className="font-mono text-sm font-semibold underline-offset-4 hover:text-rio hover:underline">
          {r.codigo}
        </Link>
        <InsigniaEstado estado={r.estado} />
      </div>

      <p className="mt-3 font-display text-lg font-semibold">{r.nombre}</p>
      <p className="text-sm text-niebla">{telefonoLegible(r.telefono)}</p>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-niebla">Habitación</dt>
          <dd className="text-right font-medium">
            {r.habitacion}, {r.huespedes} {r.huespedes === 1 ? "huésped" : "huéspedes"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-niebla">Fechas</dt>
          <dd className="text-right font-medium">
            {fechaLegible(r.llegada)} → {fechaLegible(r.salida)}
            <span className="font-normal text-niebla"> ({r.noches} {r.noches === 1 ? "noche" : "noches"})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-niebla">Total</dt>
          <dd className="font-semibold">{formatearPrecio(r.total)}</dd>
        </div>
      </dl>

      {r.notas && <p className="mt-3 rounded-xl bg-papel px-3 py-2 text-sm text-niebla">“{r.notas}”</p>}
      {r.notasInternas.length > 0 && (
        <p className="mt-2 text-xs text-niebla">
          {r.notasInternas.length} {r.notasInternas.length === 1 ? "nota interna" : "notas internas"}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <AccionesReserva reserva={r} hoy={hoy} />
        <Link href={`/panel/reservas/${r.id}`} className="text-sm font-semibold text-rio underline-offset-4 hover:underline">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
