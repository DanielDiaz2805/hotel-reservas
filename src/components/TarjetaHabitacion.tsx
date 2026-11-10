import Link from "next/link";
import type { HabitacionPublica } from "@/lib/habitaciones";
import { formatearPrecio, personas } from "@/lib/formato";
import { VisualHabitacion } from "./VisualHabitacion";

type Estadia = { noches: number; total: number; consulta: string };

export function TarjetaHabitacion({ habitacion, estadia }: { habitacion: HabitacionPublica; estadia?: Estadia }) {
  const h = habitacion;
  // Si el huésped ya buscó fechas, se llevan al detalle para no volver a escribirlas
  const enlace = `/habitaciones/${h.slug}${estadia ? `?${estadia.consulta}` : ""}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-linea bg-white transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-24px_rgba(13,58,49,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <VisualHabitacion nombre={h.nombre} tipo={h.tipo} capacidad={h.capacidad} imagen={h.imagenes[0]} />
        </div>
        <span className="absolute bottom-3 right-3 translate-y-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rio-oscuro opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver detalles →
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold">
          <Link href={enlace} className="after:absolute after:inset-0">
            {h.nombre}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-niebla">
          {personas(h.capacidad)}, {h.camas}
        </p>
        <p className="mt-3 line-clamp-2 text-[0.95rem] text-niebla">{h.descripcion}</p>

        <div className="mt-auto pt-6">
          {estadia ? (
            <>
              <p>
                <span className="font-display text-2xl font-semibold">{formatearPrecio(estadia.total)}</span>
                <span className="text-sm text-niebla">
                  {" "}
                  por {estadia.noches} {estadia.noches === 1 ? "noche" : "noches"}
                </span>
              </p>
              <p className="text-sm text-niebla">{formatearPrecio(h.precioNoche)} por noche</p>
            </>
          ) : (
            <p>
              <span className="font-display text-2xl font-semibold">{formatearPrecio(h.precioNoche)}</span>
              <span className="text-sm text-niebla"> por noche</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
