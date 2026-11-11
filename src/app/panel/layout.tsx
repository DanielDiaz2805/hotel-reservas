import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { BotonSalir } from "@/components/panel/BotonSalir";
import { NavegacionPanel } from "@/components/panel/NavegacionPanel";
import { ProveedorPanel } from "@/components/panel/ui/Proveedor";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

// El nombre del hotel pasará a leerse de la configuración cuando exista esa sección
function Marca() {
  return (
    <Link href="/panel" className="flex items-center gap-2.5 font-display font-semibold">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-sol text-sm text-rio-oscuro">BS</span>
      <span className="leading-tight">
        Brisas del Sinú
        <span className="block text-xs font-normal text-white/55">Panel del hotel</span>
      </span>
    </Link>
  );
}

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
    <ProveedorPanel>
      <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_1fr]">
        {/* Computador: columna lateral fija */}
        <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-rio-oscuro px-5 py-6 text-white lg:flex">
          <div className="space-y-8">
            <Marca />
            <NavegacionPanel variante="lateral" />
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold">{iniciales}</span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{sesion.nombre}</p>
                <p className="truncate text-xs text-white/55">{sesion.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <BotonSalir />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Celular: barra superior con la marca y la salida */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-rio-oscuro px-5 py-3 text-white lg:hidden">
            <Marca />
            <BotonSalir />
          </header>

          <main className="mx-auto max-w-6xl px-5 py-8 pb-28 sm:px-8 lg:py-10 lg:pb-12">{children}</main>
        </div>
      </div>

      {/* Celular: barra de navegación inferior */}
      <NavegacionPanel variante="inferior" />
    </ProveedorPanel>
  );
}
