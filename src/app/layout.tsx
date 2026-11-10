import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { numeroHotel } from "@/lib/whatsapp";
import { BotonWhatsApp } from "@/components/BotonWhatsApp";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Hotel Brisas del Sinú | Montería", template: "%s | Hotel Brisas del Sinú" },
  description:
    "Reserva tu habitación en el Hotel Brisas del Sinú, en Montería. Consulta disponibilidad y confirma tu reserva por WhatsApp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const whatsapp = numeroHotel();
  return (
    <html lang="es">
      <body className={`${bricolage.variable} ${figtree.variable} antialiased`}>
        <header className="absolute inset-x-0 top-0 z-10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
            <Link href="/" className="font-display text-lg font-semibold text-white">
              Brisas del Sinú
            </Link>
            <Link
              href="/#habitaciones"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Habitaciones
            </Link>
          </nav>
        </header>

        {children}

        {whatsapp && <BotonWhatsApp numero={whatsapp} />}

        <footer className="border-t border-linea">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-niebla sm:flex-row sm:justify-between sm:px-8">
            <p>
              <span className="font-display font-semibold text-tinta">Hotel Brisas del Sinú</span>, Montería, Córdoba
            </p>
            <p>Proyecto de demostración con datos ficticios.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
