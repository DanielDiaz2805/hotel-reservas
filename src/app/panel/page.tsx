import Link from "next/link";
import {
  contarPorEstado,
  esEstado,
  listarReservas,
  resumenDelDia,
  telefonoLegible,
  type EstadoReserva,
  type ReservaAdmin,
} from "@/lib/panel";
import { obtenerSesion } from "@/lib/auth";
import { fechaCompleta, fechaLegible, hoyEnColombia, ZONA_HOTEL } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/formato";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { AnilloOcupacion } from "@/components/panel/AnilloOcupacion";
import { IconoLlegada, IconoSalida } from "@/components/panel/Iconos";
import { Contador } from "@/components/Contador";
import { EstadoVacio } from "@/components/panel/ui/EstadoVacio";
import { IconoCheck, IconoReloj } from "@/components/panel/Iconos";

export const dynamic = "force-dynamic";

const pestanas: { estado: EstadoReserva; texto: string }[] = [
  { estado: "pendiente", texto: "Pendientes" },
  { estado: "confirmada", texto: "Confirmadas" },
  { estado: "cancelada", texto: "Canceladas" },
];

const estilosEstado: Record<EstadoReserva, { insignia: string; punto: string }> = {
  pendiente: { insignia: "bg-sol/20 text-[#7a5300]", punto: "bg-sol animate-pulse" },
  confirmada: { insignia: "bg-rio/12 text-rio-oscuro", punto: "bg-rio" },
  cancelada: { insignia: "bg-red-100 text-red-800", punto: "bg-red-500" },
};

const vacios: Record<EstadoReserva, { titulo: string; descripcion: string; icono: React.ReactNode }> = {
  pendiente: {
    titulo: "No tienes reservas por confirmar",
    descripcion: "Cuando un huésped envíe una solicitud desde la web, aparecerá aquí para que la confirmes.",
    icono: <IconoReloj />,
  },
  confirmada: {
    titulo: "Todavía no hay reservas confirmadas",
    descripcion: "Las reservas que confirmes quedarán aquí, listas para avisarle al huésped por WhatsApp.",
    icono: <IconoCheck />,
  },
  cancelada: {
    titulo: "No hay reservas canceladas",
    descripcion: "Las reservas que canceles se guardan aquí como historial.",
    icono: <IconoCheck />,
  },
};

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: ZONA_HOTEL }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function Panel({ searchParams }: Props) {
  const { estado: parametro } = await searchParams;
  // Por defecto se muestran las pendientes: son las que requieren acción
  const estado: EstadoReserva = esEstado(parametro) ? parametro : "pendiente";
  const hoy = hoyEnColombia();
  const [reservas, conteo, resumen, sesion] = await Promise.all([
    listarReservas(estado),
    contarPorEstado(),
    resumenDelDia(hoy),
    obtenerSesion(),
  ]);
  const nombre = sesion?.nombre.split(" ")[0] ?? "";

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
              <span className="block text-sm font-normal text-white/70">
                de {resumen.totalHabitaciones} habitaciones
              </span>
            </p>
          </div>
        </div>

        <TarjetaDia
          titulo="Llegadas hoy"
          icono={<IconoLlegada />}
          tono="bg-rio/10 text-rio"
          reservas={resumen.llegadas}
          vacio="Nadie llega hoy"
          retraso={160}
        />
        <TarjetaDia
          titulo="Salidas hoy"
          icono={<IconoSalida />}
          tono="bg-sky-100 text-sky-700"
          reservas={resumen.salidas}
          vacio="Nadie sale hoy"
          retraso={240}
        />

        <Link
          href="/panel?estado=pendiente"
          className="group relative overflow-hidden rounded-3xl border border-linea bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sol hover:shadow-[0_20px_40px_-24px_rgba(242,177,52,0.8)] animate-subir"
          style={{ animationDelay: "320ms" }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sol/20 text-[#7a5300]">
            <IconoReloj />
          </span>
          <p className="mt-4 text-sm text-niebla">Por confirmar</p>
          <p className="font-display text-4xl font-semibold">
            <Contador valor={resumen.pendientes} retraso={320} />
          </p>
          <p className="mt-2 text-sm text-niebla">
            {resumen.pendientes === 0 ? "Todo al día ✨" : "Responde pronto para no perder la reserva"}
          </p>
          <span
            aria-hidden
            className="absolute bottom-6 right-6 text-xl text-sol opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          >
            →
          </span>
        </Link>
      </section>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-4 animate-subir" style={{ animationDelay: "400ms" }}>
        <h2 className="font-display text-2xl font-semibold">Reservas</h2>
        <nav aria-label="Filtrar por estado" className="flex gap-1 rounded-full border border-linea bg-white p-1">
          {pestanas.map((p) => {
            const activa = p.estado === estado;
            return (
              <Link
                key={p.estado}
                href={`/panel?estado=${p.estado}`}
                aria-current={activa ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activa ? "bg-rio text-white shadow-md" : "text-niebla hover:bg-papel hover:text-tinta"
                }`}
              >
                {p.texto}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${activa ? "bg-white/20" : "bg-papel"}`}
                >
                  {conteo[p.estado]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {reservas.length === 0 ? (
        <div className="mt-6">
          <EstadoVacio titulo={vacios[estado].titulo} descripcion={vacios[estado].descripcion} icono={vacios[estado].icono} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-linea bg-white shadow-[0_10px_40px_-30px_rgba(13,58,49,0.5)]">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-papel/60 text-xs uppercase tracking-wide text-niebla">
              <tr>
                <th className="px-5 py-3.5 font-medium">Código</th>
                <th className="px-5 py-3.5 font-medium">Huésped</th>
                <th className="px-5 py-3.5 font-medium">Habitación</th>
                <th className="px-5 py-3.5 font-medium">Fechas</th>
                <th className="px-5 py-3.5 text-right font-medium">Total</th>
                <th className="px-5 py-3.5 font-medium">Estado</th>
                <th className="px-5 py-3.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {reservas.map((r, i) => (
                <tr
                  key={r.id}
                  className="align-top transition-colors hover:bg-papel/60 animate-subir"
                  style={{ animationDelay: `${450 + i * 60}ms` }}
                >
                  <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold">{r.codigo}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{r.nombre}</p>
                    <p className="whitespace-nowrap text-niebla">{telefonoLegible(r.telefono)}</p>
                    {r.notas && (
                      <p className="mt-1.5 max-w-56 rounded-lg bg-papel px-2 py-1 text-xs text-niebla">“{r.notas}”</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {r.habitacion}
                    <p className="text-niebla">
                      {r.huespedes} {r.huespedes === 1 ? "huésped" : "huéspedes"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {fechaLegible(r.llegada)} → {fechaLegible(r.salida)}
                    <p className="text-niebla">
                      {r.noches} {r.noches === 1 ? "noche" : "noches"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">{formatearPrecio(r.total)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${estilosEstado[r.estado].insignia}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${estilosEstado[r.estado].punto}`} />
                      {r.estado[0].toUpperCase() + r.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AccionesReserva reserva={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TarjetaDia({
  titulo,
  icono,
  tono,
  reservas,
  vacio,
  retraso,
}: {
  titulo: string;
  icono: React.ReactNode;
  tono: string;
  reservas: ReservaAdmin[];
  vacio: string;
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
        <Contador valor={reservas.length} retraso={retraso} />
      </p>
      {reservas.length === 0 ? (
        <p className="mt-2 text-sm text-niebla">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {reservas.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-papel text-[0.65rem] font-semibold">
                {r.nombre[0]?.toUpperCase()}
              </span>
              <span className="truncate">
                {r.nombre.split(" ")[0]} <span className="text-niebla">· {r.habitacion}</span>
              </span>
              {r.estado === "pendiente" && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sol" title="Pendiente" />
              )}
            </li>
          ))}
          {reservas.length > 3 && <li className="pl-8 text-niebla">y {reservas.length - 3} más</li>}
        </ul>
      )}
    </div>
  );
}
