import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerReservaPorCodigo } from "@/lib/reservas";
import { fechaCompleta } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/formato";
import { enlaceWhatsApp, numeroHotel } from "@/lib/whatsapp";
import { IconoWhatsApp } from "@/components/IconoWhatsApp";

export const dynamic = "force-dynamic";
// La página de una reserva no debe aparecer en Google
export const metadata: Metadata = { title: "Mi reserva", robots: { index: false, follow: false } };

const estados: Record<string, { texto: string; detalle: string; estilo: string }> = {
  pendiente: {
    texto: "Pendiente",
    detalle: "El hotel aún no ha confirmado tu reserva. Si ya enviaste los datos por WhatsApp, te responderán pronto.",
    estilo: "bg-sol/20 text-[#7a5300]",
  },
  confirmada: {
    texto: "Confirmada",
    detalle: "Tu habitación está reservada. ¡Te esperamos!",
    estilo: "bg-rio/15 text-rio-oscuro",
  },
  cancelada: {
    texto: "Cancelada",
    detalle: "Esta reserva fue cancelada. Escríbenos si quieres buscar otras fechas.",
    estilo: "bg-red-100 text-red-800",
  },
};

export default async function EstadoReserva({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const r = await obtenerReservaPorCodigo(codigo.toUpperCase());
  if (!r) notFound();

  const estado = estados[r.estado] ?? estados.pendiente;
  const whatsapp = numeroHotel();

  return (
    <main>
      <div className="bg-rio-oscuro pb-10 pt-24" />
      <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
        <p className="text-sm text-niebla">Reserva a nombre de {r.nombre.split(" ")[0]}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-wide">{r.codigo}</h1>
        <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${estado.estilo}`}>{estado.texto}</p>
        <p className="mt-3 text-niebla">{estado.detalle}</p>

        <dl className="mt-8 divide-y divide-linea rounded-2xl border border-linea bg-white">
          {[
            ["Habitación", r.habitacion],
            ["Llegada", fechaCompleta(r.llegada)],
            ["Salida", fechaCompleta(r.salida)],
            ["Huéspedes", String(r.huespedes)],
            ["Total", `${formatearPrecio(r.total)} (${r.noches} ${r.noches === 1 ? "noche" : "noches"})`],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="text-niebla">{etiqueta}</dt>
              <dd className="text-right font-medium first-letter:uppercase">{valor}</dd>
            </div>
          ))}
        </dl>

        {whatsapp && (
          <a
            href={enlaceWhatsApp(whatsapp, `Hola, Hotel Brisas del Sinú. Quiero consultar mi reserva ${r.codigo}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-[#0b3d22] hover:bg-[#1ebe5a]"
          >
            <IconoWhatsApp />
            Consultar por WhatsApp
          </a>
        )}
        <Link href="/" className="mt-4 block text-center text-sm font-medium text-rio underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
