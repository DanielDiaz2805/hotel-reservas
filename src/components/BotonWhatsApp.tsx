import { enlaceWhatsApp } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./IconoWhatsApp";

/** Botón flotante para escribirle al hotel desde cualquier página. */
export function BotonWhatsApp({ numero }: { numero: string }) {
  const href = enlaceWhatsApp(numero, "Hola, Hotel Brisas del Sinú. Quisiera información sobre sus habitaciones.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir al hotel por WhatsApp"
      className="group fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-[#0b3d22] shadow-[0_12px_30px_-10px_rgba(37,211,102,0.9)] transition-transform duration-300 hover:scale-105 animate-escala [animation-delay:1.2s]"
    >
      {/* Onda suave que invita a hacer clic */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full animate-latido" />
      <IconoWhatsApp className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  );
}
