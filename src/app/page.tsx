import Link from "next/link";
import { obtenerHabitaciones } from "@/lib/habitaciones";
import { habitacionesDisponibles } from "@/lib/reservas";
import { busquedaSchema, erroresPorCampo } from "@/lib/validacion";
import { hoyEnColombia, fechaLegible } from "@/lib/fechas";
import { TarjetaHabitacion } from "@/components/TarjetaHabitacion";
import { BuscadorFechas } from "@/components/BuscadorFechas";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Inicio({ searchParams }: Props) {
  const parametros = await searchParams;
  const hoy = hoyEnColombia();
  const buscando = Boolean(parametros.llegada || parametros.salida);
  const busqueda = buscando ? busquedaSchema.safeParse(parametros) : null;
  const erroresBusqueda = busqueda && !busqueda.success ? Object.values(erroresPorCampo(busqueda.error)) : [];

  let contenido: React.ReactNode;
  try {
    if (busqueda?.success) {
      const { llegada, salida, huespedes } = busqueda.data;
      const disponibles = await habitacionesDisponibles(llegada, salida, huespedes);
      const consulta = new URLSearchParams({ llegada, salida, huespedes: String(huespedes) }).toString();
      contenido = (
        <>
          <p className="mt-3 text-niebla">
            {disponibles.length === 0
              ? "No hay habitaciones disponibles"
              : `${disponibles.length} ${disponibles.length === 1 ? "habitación disponible" : "habitaciones disponibles"}`}{" "}
            del {fechaLegible(llegada)} al {fechaLegible(salida)} para {huespedes}{" "}
            {huespedes === 1 ? "huésped" : "huéspedes"}.{" "}
            <Link href="/#habitaciones" className="font-medium text-rio underline underline-offset-4">
              Ver todas
            </Link>
          </p>
          {disponibles.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-linea p-6 text-niebla">
              Prueba con otras fechas o con menos huéspedes.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {disponibles.map((h) => (
                <TarjetaHabitacion key={h.id} habitacion={h} estadia={{ noches: h.noches, total: h.total, consulta }} />
              ))}
            </div>
          )}
        </>
      );
    } else {
      const habitaciones = await obtenerHabitaciones();
      contenido = (
        <>
          <p className="mt-3 max-w-xl text-niebla">
            Todas incluyen desayuno, aire acondicionado y Wi-Fi. Elige tus fechas arriba para ver cuáles están libres.
          </p>
          {habitaciones.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-linea p-6 text-niebla">
              Aún no hay habitaciones publicadas. Ejecuta <code>npm run seed</code> para cargar las de ejemplo.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {habitaciones.map((h) => (
                <TarjetaHabitacion key={h.id} habitacion={h} />
              ))}
            </div>
          )}
        </>
      );
    }
  } catch (e) {
    console.error("Error al cargar habitaciones:", e);
    contenido = (
      <p role="alert" className="mt-10 rounded-xl border border-linea bg-white p-6">
        No pudimos cargar las habitaciones en este momento. Recarga la página en unos segundos.
      </p>
    );
  }

  const inicial = busqueda?.success
    ? busqueda.data
    : {
        llegada: typeof parametros.llegada === "string" ? parametros.llegada : undefined,
        salida: typeof parametros.salida === "string" ? parametros.salida : undefined,
      };

  return (
    <main>
      <section className="relative overflow-hidden bg-rio-oscuro pb-28 pt-36 text-white sm:pb-36 sm:pt-44">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-sm font-medium text-sol">Montería, Córdoba</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Descansa a pocas cuadras del río Sinú
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            Elige tus fechas, mira qué habitaciones están libres y confirma tu reserva por WhatsApp, sin esperas ni
            llamadas.
          </p>
          <BuscadorFechas key={`${inicial.llegada}-${inicial.salida}`} hoy={hoy} inicial={inicial} />
          {erroresBusqueda.length > 0 && (
            <p role="alert" className="mt-3 text-sm text-sol">
              {erroresBusqueda.join(". ")}.
            </p>
          )}
        </div>

        <svg
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 w-full sm:h-32"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path d="M0 70 C 240 20, 480 110, 720 64 S 1200 20, 1440 60 L1440 120 L0 120 Z" className="fill-papel" />
          <path d="M0 52 C 240 2, 480 92, 720 46 S 1200 2, 1440 42" fill="none" className="stroke-sol/70" strokeWidth="2" />
        </svg>
      </section>

      <section id="habitaciones" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          {busqueda?.success ? "Disponibles para tus fechas" : "Nuestras habitaciones"}
        </h2>
        {contenido}
      </section>
    </main>
  );
}
