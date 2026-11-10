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
import { fechaCompleta, fechaLegible, hoyEnColombia } from "@/lib/fechas";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { formatearPrecio } from "@/lib/formato";

export const dynamic = "force-dynamic";

const pestanas: { estado: EstadoReserva; texto: string }[] = [
  { estado: "pendiente", texto: "Pendientes" },
  { estado: "confirmada", texto: "Confirmadas" },
  { estado: "cancelada", texto: "Canceladas" },
];

const estilosEstado: Record<EstadoReserva, string> = {
  pendiente: "bg-sol/20 text-[#7a5300]",
  confirmada: "bg-rio/15 text-rio-oscuro",
  cancelada: "bg-red-100 text-red-800",
};

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function Panel({ searchParams }: Props) {
  const { estado: parametro } = await searchParams;
  // Por defecto se muestran las pendientes: son las que requieren acción
  const estado: EstadoReserva = esEstado(parametro) ? parametro : "pendiente";
  const hoy = hoyEnColombia();
  const [reservas, conteo, resumen] = await Promise.all([listarReservas(estado), contarPorEstado(), resumenDelDia(hoy)]);
  const porcentaje = resumen.totalHabitaciones ? Math.round((resumen.ocupadasHoy / resumen.totalHabitaciones) * 100) : 0;

  return (
    <>
      <p className="text-sm text-niebla first-letter:uppercase">{fechaCompleta(hoy)}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Hoy en el hotel</h1>

      <section aria-label="Resumen del día" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-rio-oscuro p-5 text-white">
          <p className="text-sm text-white/70">Ocupación esta noche</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {resumen.ocupadasHoy} <span className="text-lg font-normal text-white/60">de {resumen.totalHabitaciones}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <div className="h-full rounded-full bg-sol" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
        <ListaDelDia titulo="Llegadas hoy" reservas={resumen.llegadas} />
        <ListaDelDia titulo="Salidas hoy" reservas={resumen.salidas} />
        <Link
          href="/panel?estado=pendiente"
          className="rounded-2xl border border-linea bg-white p-5 transition-colors hover:border-sol"
        >
          <p className="text-sm text-niebla">Por confirmar</p>
          <p className="mt-1 font-display text-3xl font-semibold">{resumen.pendientes}</p>
          <p className="mt-2 text-sm text-niebla">
            {resumen.pendientes === 0 ? "Todo al día" : "Responde pronto para no perder la reserva"}
          </p>
        </Link>
      </section>

      <h2 className="mt-12 font-display text-2xl font-semibold">Reservas</h2>

      <nav aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
        {pestanas.map((p) => (
          <Link
            key={p.estado}
            href={`/panel?estado=${p.estado}`}
            aria-current={p.estado === estado ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              p.estado === estado ? "border-rio bg-rio text-white" : "border-linea bg-white hover:border-rio"
            }`}
          >
            {p.texto} <span className="opacity-70">({conteo[p.estado]})</span>
          </Link>
        ))}
      </nav>

      {reservas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-linea p-8 text-niebla">
          No hay reservas {pestanas.find((p) => p.estado === estado)?.texto.toLowerCase()}.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-linea bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-linea text-niebla">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Huésped</th>
                <th className="px-4 py-3 font-medium">Habitación</th>
                <th className="px-4 py-3 font-medium">Fechas</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {reservas.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold">{r.codigo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.nombre}</p>
                    <p className="text-niebla">{telefonoLegible(r.telefono)}</p>
                    {r.notas && <p className="mt-1 max-w-56 text-xs text-niebla">“{r.notas}”</p>}
                  </td>
                  <td className="px-4 py-3">
                    {r.habitacion}
                    <p className="text-niebla">
                      {r.huespedes} {r.huespedes === 1 ? "huésped" : "huéspedes"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {fechaLegible(r.llegada)} → {fechaLegible(r.salida)}
                    <p className="text-niebla">
                      {r.noches} {r.noches === 1 ? "noche" : "noches"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatearPrecio(r.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estilosEstado[r.estado]}`}>
                      {r.estado[0].toUpperCase() + r.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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

function ListaDelDia({ titulo, reservas }: { titulo: string; reservas: ReservaAdmin[] }) {
  return (
    <div className="rounded-2xl border border-linea bg-white p-5">
      <p className="text-sm text-niebla">{titulo}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{reservas.length}</p>
      {reservas.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm">
          {reservas.slice(0, 3).map((r) => (
            <li key={r.id} className="truncate">
              {r.nombre.split(" ")[0]}, {r.habitacion}
              {r.estado === "pendiente" && <span className="text-[#7a5300]"> (pendiente)</span>}
            </li>
          ))}
          {reservas.length > 3 && <li className="text-niebla">y {reservas.length - 3} más</li>}
        </ul>
      )}
    </div>
  );
}
