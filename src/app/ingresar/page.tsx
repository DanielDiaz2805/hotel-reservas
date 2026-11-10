import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden bg-rio-oscuro p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-rio/60 blur-3xl animate-flotar" />
        <div
          aria-hidden
          className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-sol/25 blur-3xl animate-flotar"
          style={{ animationDelay: "-3s" }}
        />
        <Link href="/" className="relative flex items-center gap-2.5 font-display text-lg font-semibold animate-aparecer">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sol text-sm text-rio-oscuro">BS</span>
          Brisas del Sinú
        </Link>
        <div className="relative">
          <h2 className="max-w-md font-display text-5xl font-semibold leading-[1.05] tracking-tight animate-subir">
            Cada reserva, en orden y a un clic de WhatsApp.
          </h2>
          <p className="mt-5 max-w-sm text-white/70 animate-subir" style={{ animationDelay: "120ms" }}>
            Confirma solicitudes, revisa las llegadas del día y avisa a tus huéspedes sin perder ningún mensaje.
          </p>
        </div>
        <svg aria-hidden viewBox="0 0 600 120" className="relative w-full" preserveAspectRatio="none">
          <path
            d="M0 70 C 120 20, 240 110, 360 60 S 520 20, 600 50"
            pathLength={1}
            fill="none"
            strokeWidth="2.5"
            className="stroke-sol trazo-animado animate-dibujar"
          />
          <path
            d="M0 95 C 140 55, 260 125, 380 85 S 540 55, 600 80"
            pathLength={1}
            fill="none"
            strokeWidth="1.5"
            className="stroke-white/30 trazo-animado animate-dibujar"
            style={{ animationDelay: "300ms" }}
          />
        </svg>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm animate-subir" style={{ animationDelay: "150ms" }}>
          <p className="font-display text-sm font-semibold text-rio lg:hidden">Brisas del Sinú</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Panel del hotel</h1>
          <p className="mt-2 text-niebla">Ingresa para gestionar las reservas.</p>
          <FormularioIngreso siguiente={destino} />
          <Link href="/" className="mt-8 block text-center text-sm text-niebla hover:text-rio">
            ← Volver al sitio
          </Link>
        </div>
      </section>
    </main>
  );
}
