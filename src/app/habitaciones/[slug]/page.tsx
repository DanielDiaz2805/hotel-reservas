import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerHabitacionPorSlug } from "@/lib/habitaciones";
import { personas } from "@/lib/formato";
import { VisualHabitacion } from "@/components/VisualHabitacion";
import { FormularioReserva } from "@/components/FormularioReserva";
import { esFechaValida, hoyEnColombia } from "@/lib/fechas";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const h = await obtenerHabitacionPorSlug(slug);
  return h ? { title: h.nombre, description: h.descripcion } : { title: "Habitación no encontrada" };
}

export default async function DetalleHabitacion({ params, searchParams }: Props) {
  const { slug } = await params;
  const consulta = await searchParams;
  // Fechas que vienen de la búsqueda en la página de inicio (si las hay)
  const fecha = (valor: unknown) => (typeof valor === "string" && esFechaValida(valor) ? valor : undefined);
  const inicial = {
    llegada: fecha(consulta.llegada),
    salida: fecha(consulta.salida),
    huespedes: Number(consulta.huespedes) || undefined,
  };
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

            <div className="mt-10">
              <FormularioReserva
                habitacion={{ id: h.id, slug: h.slug, nombre: h.nombre, precioNoche: h.precioNoche, capacidad: h.capacidad }}
                hoy={hoyEnColombia()}
                inicial={inicial}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
