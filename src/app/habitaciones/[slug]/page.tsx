import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerHabitacionPorSlug } from "@/lib/habitaciones";
import { formatearPrecio, personas } from "@/lib/formato";
import { VisualHabitacion } from "@/components/VisualHabitacion";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const h = await obtenerHabitacionPorSlug(slug);
  return h ? { title: h.nombre, description: h.descripcion } : { title: "Habitación no encontrada" };
}

export default async function DetalleHabitacion({ params }: Props) {
  const { slug } = await params;
  const h = await obtenerHabitacionPorSlug(slug);
  if (!h) notFound();

  return (
    <main>
      <div className="bg-rio-oscuro pb-10 pt-24" />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Link href="/#habitaciones" className="text-sm font-medium text-rio hover:underline">
          Todas las habitaciones
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-linea">
            <VisualHabitacion nombre={h.nombre} tipo={h.tipo} capacidad={h.capacidad} imagen={h.imagenes[0]} prioridad />
          </div>

          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{h.nombre}</h1>
            <p className="mt-2 text-niebla">
              Hasta {personas(h.capacidad)}, {h.camas}
            </p>
            <p className="mt-6 text-lg leading-relaxed">{h.descripcion}</p>

            <h2 className="mt-8 font-display text-lg font-semibold">Incluye</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.95rem]">
              {h.comodidades.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rio" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-linea bg-white p-6">
              <p>
                <span className="font-display text-3xl font-semibold">{formatearPrecio(h.precioNoche)}</span>
                <span className="text-niebla"> por noche</span>
              </p>
              {/* En el paso 4 aquí irá el formulario de fechas y la verificación de disponibilidad */}
              <p className="mt-3 text-sm text-niebla">Muy pronto podrás elegir tus fechas y reservar desde aquí.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
