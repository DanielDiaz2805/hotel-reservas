import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { BotonWhatsApp } from "@/components/BotonWhatsApp";
import { SoloSitioPublico } from "@/components/SoloSitioPublico";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

// Los datos del hotel salen de la base de datos: la página no se congela al compilar
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const hotel = await obtenerConfiguracion();
  return {
    title: { default: `${hotel.nombre} | ${hotel.ciudad.split(",")[0]}`, template: `%s | ${hotel.nombre}` },
    description: `Reserva tu habitación en ${hotel.nombre}, en ${hotel.ciudad}. Consulta disponibilidad y confirma tu reserva por WhatsApp.`,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const hotel = await obtenerConfiguracion();
  const whatsapp = hotel.whatsapp;
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`${bricolage.variable} ${figtree.variable} antialiased`}>
        {/* El encabezado, el pie y el botón de WhatsApp son del sitio público; el panel tiene los suyos */}
        <SoloSitioPublico>
          <header className="absolute inset-x-0 top-0 z-10">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
              <Link href="/" className="font-display text-lg font-semibold text-white">
                {hotel.nombreCorto}
              </Link>
              <Link
                href="/#habitaciones"
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Habitaciones
              </Link>
            </nav>
          </header>
        </SoloSitioPublico>

        {children}

        <SoloSitioPublico>
          {whatsapp && <BotonWhatsApp numero={whatsapp} hotel={hotel.nombre} />}
          <footer className="border-t border-linea">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-niebla sm:flex-row sm:justify-between sm:px-8">
              <p>
                <span className="font-display font-semibold text-tinta">{hotel.nombre}</span>, {hotel.ciudad}
              </p>
              {hotel.notaPie && <p>{hotel.notaPie}</p>}
            </div>
          </footer>
        </SoloSitioPublico>
      </body>
    </html>
  );
}
