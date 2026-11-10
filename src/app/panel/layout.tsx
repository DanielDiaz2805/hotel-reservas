import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { BotonSalir } from "@/components/panel/BotonSalir";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  // Segunda capa de protección, además del middleware
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingresar");

  const iniciales = sesion.nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-rio-oscuro/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/panel" className="flex items-center gap-2.5 font-display font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sol text-sm text-rio-oscuro">BS</span>
            Brisas del Sinú <span className="font-normal text-white/50">Panel</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-2 text-white/80 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold">
                {iniciales}
              </span>
              {sesion.nombre}
            </span>
            <BotonSalir />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
