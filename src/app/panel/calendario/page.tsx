import type { Metadata } from "next";
import Link from "next/link";
import { esFechaValida, hoyEnColombia, sumarDias } from "@/lib/fechas";
import { listarBloqueos, obtenerCalendario, type SegmentoCalendario } from "@/lib/calendario";
import { clasesBoton } from "@/components/panel/ui/Boton";
import { BloquearFechas } from "@/components/panel/calendario/BloquearFechas";
import { ListaBloqueos } from "@/components/panel/calendario/ListaBloqueos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendario" };

const DIAS_VISIBLES = 14;
const ANCHO_DIA = "3.25rem";

const mes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
const diaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" });
const diaMes = new Intl.DateTimeFormat("es-CO", { day: "numeric", timeZone: "UTC" });
const corta = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const en = (f: string) => new Date(`${f}T00:00:00Z`);

const estilosBarra: Record<string, string> = {
  pendiente: "bg-sol/35 text-[#6b4700] ring-1 ring-inset ring-sol",
  confirmada: "bg-rio text-white",
  en_casa: "bg-sky-500 text-white",
  finalizada: "bg-papel text-niebla ring-1 ring-inset ring-linea",
};

const LEYENDA: [string, string][] = [
  ["Por confirmar", "bg-sol/35 ring-1 ring-inset ring-sol"],
  ["Confirmada", "bg-rio"],
  ["En casa", "bg-sky-500"],
  ["Finalizada", "bg-papel ring-1 ring-inset ring-linea"],
  ["Bloqueada", "bg-[repeating-linear-gradient(45deg,#d4d4d8,#d4d4d8_4px,#f4f4f5_4px,#f4f4f5_8px)]"],
];

function Barra({ s }: { s: SegmentoCalendario }) {
  const posicion = { gridColumn: `${s.desde + 2} / span ${s.largo}` };
  const base = "z-[1] mx-0.5 my-1.5 flex min-w-0 items-center truncate rounded-lg px-2 text-xs font-semibold transition-transform hover:-translate-y-0.5";
  if (s.tipo === "bloqueo") {
    return (
      <a
        href="#bloqueos"
        style={posicion}
        title={s.motivo ? `Bloqueada: ${s.motivo}` : "Bloqueada"}
        className={`${base} bg-[repeating-linear-gradient(45deg,#d4d4d8,#d4d4d8_6px,#f4f4f5_6px,#f4f4f5_12px)] text-zinc-600`}
      >
        <span className="truncate">{s.motivo || "Bloqueada"}</span>
      </a>
    );
  }
  return (
    <Link
      href={`/panel/reservas/${s.id}`}
      style={posicion}
      title={`${s.huesped} · ${s.codigo} · ${corta.format(en(s.llegada))} → ${corta.format(en(s.salida))}`}
      className={`${base} ${estilosBarra[s.estado] ?? estilosBarra.confirmada}`}
    >
      <span className="truncate">{s.huesped.split(" ")[0] || s.codigo}</span>
    </Link>
  );
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CalendarioPagina({ searchParams }: Props) {
  const parametros = await searchParams;
  const hoy = hoyEnColombia();
  const pedido = typeof parametros.desde === "string" ? parametros.desde : "";
  const desde = esFechaValida(pedido) ? pedido : hoy;

  const [calendario, bloqueos] = await Promise.all([obtenerCalendario(desde, DIAS_VISIBLES), listarBloqueos(hoy)]);
  const ultimo = calendario.dias[calendario.dias.length - 1];
  const mismoMes = desde.slice(0, 7) === ultimo.slice(0, 7);
  const titulo = mismoMes ? mes.format(en(desde)) : `${corta.format(en(desde))} – ${corta.format(en(ultimo))}`;
  const columnas = `10rem repeat(${DIAS_VISIBLES}, ${ANCHO_DIA})`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 animate-subir">
        <div>
          <h1 className="font-display text-3xl font-semibold">Calendario</h1>
          <p className="mt-1 text-niebla">Toca una reserva para abrirla o un día libre para crear una reserva ahí.</p>
        </div>
        <BloquearFechas habitaciones={calendario.filas.map((f) => ({ id: f.habitacionId, nombre: f.nombre }))} hoy={hoy} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold capitalize">{titulo}</h2>
        <div className="flex gap-2">
          <Link href={`/panel/calendario?desde=${sumarDias(desde, -DIAS_VISIBLES)}`} className={clasesBoton("secundario", "sm")} aria-label="Días anteriores">
            ← Anterior
          </Link>
          <Link href="/panel/calendario" className={clasesBoton("secundario", "sm")}>
            Hoy
          </Link>
          <Link href={`/panel/calendario?desde=${sumarDias(desde, DIAS_VISIBLES)}`} className={clasesBoton("secundario", "sm")} aria-label="Días siguientes">
            Siguiente →
          </Link>
        </div>
      </div>

      {calendario.filas.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-linea bg-white p-8 text-center">
          <p className="font-display text-lg font-semibold">Aún no hay habitaciones activas</p>
          <p className="mt-1 text-niebla">Crea una en la sección Habitaciones para verla aquí.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-3xl border border-linea bg-white animate-subir">
          <div className="min-w-max">
            {/* Encabezado de días */}
            <div className="grid border-b border-linea" style={{ gridTemplateColumns: columnas }}>
              <div className="sticky left-0 z-10 bg-white" />
              {calendario.dias.map((d) => (
                <div key={d} className={`py-2 text-center ${d === hoy ? "bg-rio/8" : ""}`}>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-niebla">{diaSemana.format(en(d)).replace(".", "")}</p>
                  <p className={`mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${d === hoy ? "bg-rio text-white" : ""}`}>
                    {diaMes.format(en(d))}
                  </p>
                </div>
              ))}
            </div>

            {calendario.filas.map((fila) => {
              const cubiertos = new Set<number>();
              for (const s of fila.segmentos) for (let i = 0; i < s.largo; i++) cubiertos.add(s.desde + i);
              return (
                <div key={fila.habitacionId} className="grid border-b border-linea last:border-b-0" style={{ gridTemplateColumns: columnas, gridAutoRows: "3rem" }}>
                  <div className="sticky left-0 z-10 flex items-center border-r border-linea bg-white px-4 text-sm font-semibold" style={{ gridColumn: 1, gridRow: 1 }}>
                    <span className="truncate">{fila.nombre}</span>
                  </div>
                  {calendario.dias.map((d, i) => {
                    if (cubiertos.has(i)) return null;
                    const estilo = { gridColumn: i + 2, gridRow: 1 };
                    const fondoHoy = d === hoy ? "bg-rio/5" : "";
                    return d >= hoy ? (
                      <Link
                        key={d}
                        href={`/panel/reservas/nueva?habitacion=${fila.habitacionId}&llegada=${d}`}
                        style={estilo}
                        aria-label={`Nueva reserva en ${fila.nombre} el ${corta.format(en(d))}`}
                        className={`group grid place-items-center border-l border-linea/60 transition-colors hover:bg-rio/10 ${fondoHoy}`}
                      >
                        <span className="text-lg font-light text-rio opacity-0 transition-opacity group-hover:opacity-100">+</span>
                      </Link>
                    ) : (
                      <div key={d} style={estilo} className={`border-l border-linea/60 bg-papel/60`} />
                    );
                  })}
                  {fila.segmentos.map((s) => (
                    <Barra key={`${s.tipo}-${s.id}`} s={{ ...s }} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-niebla">
        {LEYENDA.map(([texto, clase]) => (
          <li key={texto} className="flex items-center gap-1.5">
            <span className={`h-3 w-5 rounded ${clase}`} />
            {texto}
          </li>
        ))}
      </ul>

      <section id="bloqueos" className="mt-10 scroll-mt-6 rounded-3xl border border-linea bg-white p-6">
        <h2 className="font-display text-lg font-semibold">Fechas bloqueadas</h2>
        {bloqueos.length === 0 ? (
          <p className="mt-2 text-niebla">No hay fechas bloqueadas. Usa “Bloquear fechas” para cerrar una habitación por mantenimiento, uso propio o temporada.</p>
        ) : (
          <div className="mt-4">
            <ListaBloqueos bloqueos={bloqueos} />
          </div>
        )}
      </section>
    </>
  );
}
