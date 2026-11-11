import Link from "next/link";
import type { HabitacionAdmin } from "@/lib/habitaciones-admin";
import { formatearPrecio, personas } from "@/lib/formato";
import { TIPOS } from "@/lib/habitacion-reglas";
import { VisualHabitacion } from "@/components/VisualHabitacion";
import { clasesBoton } from "@/components/panel/ui/Boton";
import { InterruptorVisible } from "@/components/panel/habitaciones/InterruptorVisible";

export function TarjetaHabitacionPanel({ h }: { h: HabitacionAdmin }) {
  const tipo = TIPOS.find((t) => t.valor === h.tipo)?.texto ?? h.tipo;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-linea bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(13,58,49,0.5)]">
      <div className="relative aspect-[16/10]">
        <div className={`h-full w-full transition-all duration-300 ${h.activa ? "" : "opacity-50 grayscale"}`}>
          <VisualHabitacion nombre={h.nombre} tipo={h.tipo} capacidad={h.capacidad} imagen={h.imagenes[0]} />
        </div>
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            h.activa ? "bg-white text-rio" : "bg-tinta/80 text-white"
          }`}
        >
          {h.activa ? "Visible en la web" : "Oculta"}
        </span>
        {h.imagenes.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">{h.imagenes.length} fotos</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-display text-lg font-semibold">{h.nombre}</h2>
        <p className="mt-1 text-sm text-niebla">
          {tipo}, hasta {personas(h.capacidad)}
        </p>
        <p className="mt-3 font-display text-xl font-semibold">
          {formatearPrecio(h.precioNoche)}
          <span className="text-sm font-normal text-niebla"> por noche</span>
        </p>
        {h.reservasVigentes > 0 && (
          <p className="mt-1 text-sm text-niebla">
            {h.reservasVigentes} {h.reservasVigentes === 1 ? "reserva vigente" : "reservas vigentes"}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <InterruptorVisible id={h.id} nombre={h.nombre} activa={h.activa} reservasVigentes={h.reservasVigentes} />
          <Link href={`/panel/habitaciones/${h.id}`} className={clasesBoton("secundario", "sm")}>
            Editar
          </Link>
        </div>
      </div>
    </article>
  );
}
