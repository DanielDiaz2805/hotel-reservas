import type { Metadata } from "next";
import Link from "next/link";
import { buscarReservas, contarPorEstado, esEstado, telefonoLegible, RESERVAS_POR_PAGINA, type FiltroEstado } from "@/lib/panel";
import { listarHabitacionesAdmin } from "@/lib/habitaciones-admin";
import { esFechaValida, fechaLegible, hoyEnColombia } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/formato";
import { AccionesReserva } from "@/components/panel/AccionesReserva";
import { IconoBuscar, IconoCheck, IconoReloj, IconoReservas } from "@/components/panel/Iconos";
import { clasesBoton } from "@/components/panel/ui/Boton";
import { EstadoVacio } from "@/components/panel/ui/EstadoVacio";
import { FiltrosReservas } from "@/components/panel/reservas/FiltrosReservas";
import { InsigniaEstado } from "@/components/panel/reservas/InsigniaEstado";
import { Paginacion } from "@/components/panel/reservas/Paginacion";
import { TarjetaReserva } from "@/components/panel/reservas/TarjetaReserva";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reservas" };

const vacios: Record<FiltroEstado, { titulo: string; descripcion: string; icono: React.ReactNode }> = {
  activas: {
    titulo: "No hay reservas activas",
    descripcion: "Cuando un huésped reserve desde la web, la solicitud aparecerá aquí.",
    icono: <IconoReservas />,
  },
  pendiente: {
    titulo: "No tienes reservas por confirmar",
    descripcion: "Cuando un huésped envíe una solicitud desde la web, aparecerá aquí para que la confirmes.",
    icono: <IconoReloj />,
  },
  confirmada: {
    titulo: "No hay reservas confirmadas",
    descripcion: "Las reservas que confirmes quedarán aquí hasta que el huésped llegue.",
    icono: <IconoCheck />,
  },
  en_casa: {
    titulo: "No hay huéspedes en casa",
    descripcion: "Cuando registres un check-in, el huésped aparecerá aquí hasta su salida.",
    icono: <IconoCheck />,
  },
  finalizada: {
    titulo: "Aún no hay estadías finalizadas",
    descripcion: "Las reservas con check-out registrado quedan aquí como historial.",
    icono: <IconoCheck />,
  },
  cancelada: {
    titulo: "No hay reservas canceladas",
    descripcion: "Las reservas que canceles se guardan aquí como historial.",
    icono: <IconoCheck />,
  },
  todas: {
    titulo: "Todavía no hay reservas",
    descripcion: "Cuando llegue la primera, la verás aquí.",
    icono: <IconoReservas />,
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Reservas({ searchParams }: Props) {
  const parametros = await searchParams;
  const valor = (clave: string) => (typeof parametros[clave] === "string" ? (parametros[clave] as string) : "");

  const estadoParam = valor("estado");
  const estado: FiltroEstado = estadoParam === "todas" || esEstado(estadoParam) ? estadoParam : "activas";
  const filtros = {
    q: valor("q").slice(0, 40),
    estado,
    habitacion: valor("habitacion"),
    desde: esFechaValida(valor("desde")) ? valor("desde") : "",
    hasta: esFechaValida(valor("hasta")) ? valor("hasta") : "",
  };

  const hoy = hoyEnColombia();
  const [resultado, conteo, habitaciones] = await Promise.all([
    buscarReservas({ ...filtros, pagina: Number(valor("pagina")) || 1 }),
    contarPorEstado(),
    listarHabitacionesAdmin(hoy),
  ]);
  const { reservas, total, pagina, paginas } = resultado;

  const conteos: Record<string, number> = {
    ...conteo,
    activas: conteo.pendiente + conteo.confirmada + conteo.en_casa,
    todas: Object.values(conteo).reduce((a, b) => a + b, 0),
  };

  const hayFiltros = Boolean(filtros.q.trim() || filtros.habitacion || filtros.desde || filtros.hasta);
  // Los filtros se conservan al cambiar de página
  const consulta: Record<string, string> = {};
  if (filtros.q.trim()) consulta.q = filtros.q.trim();
  if (estado !== "activas") consulta.estado = estado;
  if (filtros.habitacion) consulta.habitacion = filtros.habitacion;
  if (filtros.desde) consulta.desde = filtros.desde;
  if (filtros.hasta) consulta.hasta = filtros.hasta;

  const primero = (pagina - 1) * RESERVAS_POR_PAGINA + 1;
  const ultimo = primero + reservas.length - 1;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 animate-subir">
       <div>
        <h1 className="font-display text-3xl font-semibold">Reservas</h1>
        <p className="mt-1 text-niebla">
          {total === 0
            ? hayFiltros
              ? "Ninguna coincide con tu búsqueda."
              : "Todas las reservas del hotel, en un solo lugar."
            : total <= RESERVAS_POR_PAGINA
              ? `${total} ${total === 1 ? "reserva" : "reservas"}`
              : `Mostrando ${primero} a ${ultimo} de ${total} reservas`}
        </p>
       </div>
       <Link href="/panel/reservas/nueva" className={clasesBoton("primario")}>
         + Nueva reserva
       </Link>
      </div>

      <div className="mt-6">
        <FiltrosReservas
          valores={{ q: filtros.q, estado, habitacion: filtros.habitacion, desde: filtros.desde, hasta: filtros.hasta }}
          habitaciones={habitaciones.map((h) => ({ id: h.id, nombre: h.nombre }))}
          conteos={conteos}
        />
      </div>

      <div className="mt-6">
        {reservas.length === 0 ? (
          hayFiltros ? (
            <EstadoVacio
              titulo="No encontramos reservas con esos filtros"
              descripcion="Prueba con otro nombre, quita alguna fecha o cambia de habitación."
              icono={<IconoBuscar />}
            >
              <Link href={estado === "activas" ? "/panel/reservas" : `/panel/reservas?estado=${estado}`} className={clasesBoton("secundario")}>
                Limpiar filtros
              </Link>
            </EstadoVacio>
          ) : (
            <EstadoVacio titulo={vacios[estado].titulo} descripcion={vacios[estado].descripcion} icono={vacios[estado].icono} />
          )
        ) : (
          <>
            {/* Celular y tablet: tarjetas */}
            <div className="grid gap-5 md:grid-cols-2 xl:hidden">
              {reservas.map((r, i) => (
                <div key={r.id} className="animate-subir" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                  <TarjetaReserva r={r} hoy={hoy} />
                </div>
              ))}
            </div>

            {/* Pantalla ancha: tabla */}
            <div className="hidden overflow-hidden rounded-3xl border border-linea bg-white shadow-[0_10px_40px_-30px_rgba(13,58,49,0.5)] xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-papel/60 text-xs text-niebla">
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
                  {reservas.map((r) => (
                    <tr key={r.id} className="align-top transition-colors hover:bg-papel/60">
                      <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold">
                        <Link href={`/panel/reservas/${r.id}`} className="underline-offset-4 hover:text-rio hover:underline">
                          {r.codigo}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{r.nombre}</p>
                        <p className="whitespace-nowrap text-niebla">{telefonoLegible(r.telefono)}</p>
                        {r.notas && <p className="mt-1.5 max-w-52 rounded-lg bg-papel px-2 py-1 text-xs text-niebla">“{r.notas}”</p>}
                        {r.notasInternas.length > 0 && (
                          <p className="mt-1 text-xs text-niebla">
                            {r.notasInternas.length} {r.notasInternas.length === 1 ? "nota interna" : "notas internas"}
                          </p>
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
                        <InsigniaEstado estado={r.estado} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <AccionesReserva reserva={r} hoy={hoy} />
                          <Link href={`/panel/reservas/${r.id}`} className="text-sm font-semibold text-rio underline-offset-4 hover:underline">
                            Ver detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Paginacion pagina={pagina} paginas={paginas} ruta="/panel/reservas" consulta={consulta} />
          </>
        )}
      </div>
    </>
  );
}
