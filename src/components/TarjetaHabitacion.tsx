import Link from "next/link";
import type { HabitacionPublica } from "@/lib/habitaciones";
import { formatearPrecio, personas } from "@/lib/formato";
import { VisualHabitacion } from "./VisualHabitacion";

export function TarjetaHabitacion({ habitacion }: { habitacion: HabitacionPublica }) {
  const h = habitacion;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-linea bg-white transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(13,58,49,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <VisualHabitacion nombre={h.nombre} tipo={h.tipo} capacidad={h.capacidad} imagen={h.imagenes[0]} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold">
          {/* El enlace cubre toda la tarjeta, pero solo el título es el texto del enlace */}
          <Link href={`/habitaciones/${h.slug}`} className="after:absolute after:inset-0">
            {h.nombre}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-niebla">
          {personas(h.capacidad)}, {h.camas}
        </p>
        <p className="mt-3 line-clamp-2 text-[0.95rem] text-niebla">{h.descripcion}</p>

        <p className="mt-auto pt-6">
          <span className="font-display text-2xl font-semibold">{formatearPrecio(h.precioNoche)}</span>
          <span className="text-sm text-niebla"> por noche</span>
        </p>
      </div>
    </article>
  );
}
