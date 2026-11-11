import Link from "next/link";
import { redirect } from "next/navigation";
import { resumenDelDia, type ReservaAdmin } from "@/lib/panel";
import { obtenerSesion } from "@/lib/auth";
import { fechaCompleta, hoyEnColombia, ZONA_HOTEL } from "@/lib/fechas";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { AnilloOcupacion } from "@/components/panel/AnilloOcupacion";
import { IconoCheck, IconoLlegada, IconoReloj, IconoSalida } from "@/components/panel/Iconos";
import { Contador } from "@/components/Contador";
import { EstadoVacio } from "@/components/panel/ui/EstadoVacio";
import { InsigniaEstado } from "@/components/panel/reservas/InsigniaEstado";
import { TarjetaReserva } from "@/components/panel/reservas/TarjetaReserva";

export const dynamic = "force-dynamic";

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: ZONA_HOTEL }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function Panel({ searchParams }: Props) {
  // Las reservas ahora viven en su propia sección: los enlaces viejos (/panel?estado=...) siguen funcionando
  const { estado } = await searchParams;
  if (estado) redirect(`/panel/reservas?estado=${encodeURIComponent(estado)}`);

  const hoy = hoyEnColombia();
  const [resumen, sesion] = await Promise.all([resumenDelDia(hoy), obtenerSesion()]);
  const nombre = sesion?.nombre.split(" ")[0] ?? "";

  const llegaron = resumen.llegadas.filter((r) => r.estado === "en_casa").length;
  const salieron = resumen.salidas.filter((r) => r.estado === "finalizada").length;

  return (
    <>
      <div className="animate-subir">
        <p className="text-sm text-niebla first-letter:uppercase">{fechaCompleta(hoy)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {saludo()}, {nombre}
        </h1>
        <p className="mt-1 text-niebla">Así está el hotel hoy.</p>
      </div>

      <section aria-label="Resumen del día" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ocupación: la tarjeta protagonista */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rio to-rio-oscuro p-6 text-white shadow-[0_20px_50px_-20px_rgba(13,58,49,0.7)] animate-subir sm:col-span-2 lg:col-span-1"
          style={{ animationDelay: "80ms" }}
        >
          <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sol/20 blur-2xl animate-flotar" />
          <p className="relative text-sm font-medium text-white/75">Ocupación esta noche</p>
          <div className="relative mt-3 flex items-center gap-5">
            <AnilloOcupacion ocupadas={resumen.ocupadasHoy} total={resumen.totalHabitaciones} />
            <p className="font-display leading-tight">
              <span className="text-4xl font-semibold">
                <Contador valor={resumen.ocupadasHoy} retraso={200} />
              </span>
              <span className="block text-sm font-normal text-white/70">de {resumen.totalHabitaciones} habitaciones</span>
            </p>
          </div>
        </div>

        <TarjetaDia
          titulo="Llegadas hoy"
          icono={<IconoLlegada />}
          tono="bg-rio/10 text-rio"
          cantidad={resumen.llegadas.length}
          vacio="Nadie llega hoy"
          avance={`${llegaron} de ${resumen.llegadas.length} ya llegaron`}
          retraso={160}
        />
        <TarjetaDia
          titulo="Salidas hoy"
          icono={<IconoSalida />}
          tono="bg-sky-100 text-sky-700"
          cantidad={resumen.salidas.length}
          vacio="Nadie sale hoy"
          avance={`${salieron} de ${resumen.salidas.length} ya salieron`}
          retraso={240}
        />

        <Link
          href="/panel/reservas?estado=pendiente"
          className="group relative overflow-hidden rounded-3xl border border-linea bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sol hover:shadow-[0_20px_40px_-24px_rgba(242,177,52,0.8)] animate-subir"
          style={{ animationDelay: "320ms" }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sol/20 text-[#7a5300]">
            <IconoReloj />
          </span>
          <p className="mt-4 text-sm text-niebla">Por confirmar</p>
          <p className="font-display text-4xl font-semibold">
            <Contador valor={resumen.totalPendientes} retraso={320} />
          </p>
          <p className="mt-2 text-sm text-niebla">
            {resumen.totalPendientes === 0 ? "Todo al día ✨" : "Responde pronto para no perder la reserva"}
          </p>
          <span
            aria-hidden
            className="absolute bottom-6 right-6 text-xl text-sol opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          >
            →
          </span>
        </Link>
      </section>

      {/* Lo que hay que hacer hoy, con el botón al lado de cada huésped */}
      <section aria-label="Tareas de hoy" className="mt-12 grid gap-6 lg:grid-cols-2">
        <ListaDelDia titulo="Llegadas de hoy" vacio="Hoy no llega nadie." reservas={resumen.llegadas} hoy={hoy} terminada="en_casa" />
        <ListaDelDia titulo="Salidas de hoy" vacio="Hoy no sale nadie." reservas={resumen.salidas} hoy={hoy} terminada="finalizada" />
      </section>

      <section aria-label="Reservas por confirmar" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Por confirmar</h2>
          {resumen.totalPendientes > resumen.pendientes.length && (
            <Link href="/panel/reservas?estado=pendiente" className="text-sm font-semibold text-rio underline-offset-4 hover:underline">
              Ver las {resumen.totalPendientes} pendientes →
            </Link>
          )}
        </div>
        <div className="mt-5">
          {resumen.pendientes.length === 0 ? (
            <EstadoVacio
              titulo="No tienes reservas por confirmar"
              descripcion="Cuando un huésped envíe una solicitud desde la web, aparecerá aquí para que la confirmes."
              icono={<IconoCheck />}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resumen.pendientes.map((r, i) => (
                <div key={r.id} className="animate-subir" style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}>
                  <TarjetaReserva r={r} hoy={hoy} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ListaDelDia({
  titulo,
  vacio,
  reservas,
  hoy,
  terminada,
}: {
  titulo: string;
  vacio: string;
  reservas: ReservaAdmin[];
  hoy: string;
  /** Estado que indica que la tarea del día ya se hizo: en casa para llegadas, finalizada para salidas */
  terminada: "en_casa" | "finalizada";
}) {
  return (
    <div className="rounded-3xl border border-linea bg-white p-6">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      {reservas.length === 0 ? (
        <p className="mt-3 text-niebla">{vacio}</p>
      ) : (
        <ul className="mt-4 divide-y divide-linea">
          {reservas.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-papel text-sm font-semibold">{r.nombre[0]?.toUpperCase()}</span>
                <div className="min-w-0">
                  <Link href={`/panel/reservas/${r.id}`} className="block truncate font-medium underline-offset-4 hover:text-rio hover:underline">
                    {r.nombre}
                  </Link>
                  <p className="truncate text-sm text-niebla">
                    {r.habitacion}, {r.huespedes} {r.huespedes === 1 ? "huésped" : "huéspedes"}
                  </p>
                </div>
              </div>
              {r.estado === terminada ? <InsigniaEstado estado={r.estado} /> : <AccionesReserva reserva={r} hoy={hoy} compacto />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaDia({
  titulo,
  icono,
  tono,
  cantidad,
  vacio,
  avance,
  retraso,
}: {
  titulo: string;
  icono: React.ReactNode;
  tono: string;
  cantidad: number;
  vacio: string;
  avance: string;
  retraso: number;
}) {
  return (
    <div
      className="rounded-3xl border border-linea bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(13,58,49,0.45)] animate-subir"
      style={{ animationDelay: `${retraso}ms` }}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tono}`}>{icono}</span>
      <p className="mt-4 text-sm text-niebla">{titulo}</p>
      <p className="font-display text-4xl font-semibold">
        <Contador valor={cantidad} retraso={retraso} />
      </p>
      <p className="mt-2 text-sm text-niebla">{cantidad === 0 ? vacio : avance}</p>
    </div>
  );
}
