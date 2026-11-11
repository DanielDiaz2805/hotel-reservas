import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { hoyEnColombia } from "@/lib/fechas";
import { obtenerHabitacionAdmin } from "@/lib/habitaciones-admin";
import { FormularioHabitacion } from "@/components/panel/habitaciones/FormularioHabitacion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar habitación" };

export default async function EditarHabitacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const habitacion = await obtenerHabitacionAdmin(id, hoyEnColombia());
  if (!habitacion) notFound();

  return (
    <>
      <Link href="/panel/habitaciones" className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Habitaciones
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">{habitacion.nombre}</h1>
      <p className="mt-1 text-niebla">
        Dirección en la web: <span className="font-medium text-tinta">/habitaciones/{habitacion.slug}</span>
      </p>
      <div className="mt-8">
        <FormularioHabitacion inicial={habitacion} subidaDisponible={cloudinaryConfigurado()} />
      </div>
    </>
  );
}
