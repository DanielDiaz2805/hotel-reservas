import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerReservaAdmin, telefonoLegible } from "@/lib/panel";
import { fechaCompleta, fechaLegible, hoyEnColombia } from "@/lib/fechas";
import { fechaHora, formatearPrecio } from "@/lib/formato";
import { enlaceWhatsApp, normalizarNumero } from "@/lib/whatsapp";
import { IconoWhatsApp } from "@/components/IconoWhatsApp";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { clasesBoton } from "@/components/panel/ui/Boton";
import { InsigniaEstado } from "@/components/panel/reservas/InsigniaEstado";
import { NotasInternas } from "@/components/panel/reservas/NotasInternas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalle de la reserva" };

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-linea bg-white p-6">
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function DetalleReserva({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await obtenerReservaAdmin(id);
  if (!r) notFound();

  const hoy = hoyEnColombia();
  const numero = normalizarNumero(r.telefono);
  const primerNombre = r.nombre.split(" ")[0];
  const linea = [{ evento: "Solicitud recibida", fecha: r.creada, autor: "Huésped" }, ...r.historial];

  const filas: [string, React.ReactNode][] = [
    ["Habitación", <Link key="h" href={`/panel/habitaciones/${r.habitacionId}`} className="underline-offset-4 hover:text-rio hover:underline">{r.habitacion}</Link>],
    ["Llegada", <span key="l" className="first-letter:uppercase">{fechaCompleta(r.llegada)}</span>],
    ["Salida", <span key="s" className="first-letter:uppercase">{fechaCompleta(r.salida)}</span>],
    ["Noches", String(r.noches)],
    ["Huéspedes", String(r.huespedes)],
    ["Precio por noche", formatearPrecio(r.precioNoche)],
    ["Total", <strong key="t">{formatearPrecio(r.total)}</strong>],
  ];

  return (
    <>
      <Link href="/panel/reservas" className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Reservas
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3 animate-subir">
        <h1 className="font-mono text-3xl font-semibold tracking-wide">{r.codigo}</h1>
        <InsigniaEstado estado={r.estado} />
      </div>
      <p className="mt-1 text-niebla">
        A nombre de {r.nombre}. Solicitada el {fechaHora(r.creada)}.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Tarjeta titulo="La estadía">
            <dl className="divide-y divide-linea">
              {filas.map(([etiqueta, contenido]) => (
                <div key={etiqueta} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-niebla">{etiqueta}</dt>
                  <dd className="text-right font-medium">{contenido}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>

          <Tarjeta titulo="El huésped">
            <p className="font-display text-xl font-semibold">{r.nombre}</p>
            <p className="mt-0.5 text-niebla">{telefonoLegible(r.telefono)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:+57${r.telefono}`} className={clasesBoton("secundario", "sm")}>
                Llamar
              </a>
              {numero && (
                <a
                  href={enlaceWhatsApp(numero, `Hola, ${primerNombre}. Te escribimos del Hotel Brisas del Sinú sobre tu reserva ${r.codigo}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clasesBoton("whatsapp", "sm")}
                >
                  <IconoWhatsApp className="h-3.5 w-3.5" />
                  Escribir por WhatsApp
                </a>
              )}
            </div>
            {r.notas && (
              <div className="mt-5">
                <p className="text-sm text-niebla">Lo que escribió al reservar</p>
                <p className="mt-1 rounded-2xl bg-papel px-4 py-3">“{r.notas}”</p>
              </div>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Acciones">
            <AccionesReserva reserva={r} hoy={hoy} tamano="md" />
            {r.estado === "confirmada" && r.llegada > hoy && (
              <p className="mt-3 text-sm text-niebla">El check-in se habilita el {fechaLegible(r.llegada)}, el día de la llegada.</p>
            )}
            {r.estado === "en_casa" && <p className="mt-3 text-sm text-niebla">La salida está prevista para el {fechaLegible(r.salida)}.</p>}
          </Tarjeta>

          <Tarjeta titulo="Notas internas">
            <NotasInternas reservaId={r.id} iniciales={r.notasInternas} />
          </Tarjeta>

          <Tarjeta titulo="Historial">
            <ol className="relative space-y-5 border-l border-linea pl-6">
              {linea.map((e, i) => (
                <li key={`${e.fecha}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className={`absolute -left-[1.78rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${i === linea.length - 1 ? "bg-rio" : "bg-linea"}`}
                  />
                  <p className="font-medium">{e.evento}</p>
                  <p className="text-sm text-niebla">
                    {fechaHora(e.fecha)}
                    {e.autor ? `, ${e.autor}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
