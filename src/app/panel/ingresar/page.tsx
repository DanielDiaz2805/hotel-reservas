import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { FormularioIngreso } from "@/components/panel/FormularioIngreso";

export const metadata: Metadata = { title: "Ingresar al panel", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ siguiente?: string }> };

export default async function Ingresar({ searchParams }: Props) {
  const { siguiente } = await searchParams;
  // Solo se permite volver a rutas del panel: evita redirecciones a sitios externos
  const destino = siguiente?.startsWith("/panel") && !siguiente.startsWith("//") ? siguiente : "/panel";
  if (await obtenerSesion()) redirect(destino);

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-display text-sm font-semibold text-rio">Brisas del Sinú</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Panel del hotel</h1>
        <p className="mt-2 text-niebla">Ingresa para gestionar las reservas.</p>
        <FormularioIngreso siguiente={destino} />
      </div>
    </main>
  );
}
