import type { Metadata } from "next";
import Link from "next/link";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { FormularioHabitacion } from "@/components/panel/habitaciones/FormularioHabitacion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva habitación" };

export default function NuevaHabitacion() {
  return (
    <>
      <Link href="/panel/habitaciones" className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Habitaciones
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Nueva habitación</h1>
      <p className="mt-1 text-niebla">Llena los datos y mira a la derecha cómo la verá el huésped.</p>
      <div className="mt-8">
        <FormularioHabitacion subidaDisponible={cloudinaryConfigurado()} />
      </div>
    </>
  );
}
