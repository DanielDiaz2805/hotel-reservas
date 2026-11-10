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
      className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-[#0b3d22] shadow-lg transition-transform hover:scale-105"
    >
      <IconoWhatsApp className="h-6 w-6" />
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  );
}
