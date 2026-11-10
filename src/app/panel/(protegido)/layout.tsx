import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { BotonSalir } from "@/components/panel/BotonSalir";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  // Segunda capa de protección, además del middleware
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/panel/ingresar");

  return (
    <div className="min-h-screen">
      <header className="bg-rio-oscuro text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/panel" className="font-display font-semibold">
            Brisas del Sinú <span className="font-normal text-white/60">Panel</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/80 sm:inline">{sesion.nombre}</span>
            <BotonSalir />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
