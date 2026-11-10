import { obtenerHabitaciones, type HabitacionPublica } from "@/lib/habitaciones";
import { TarjetaHabitacion } from "@/components/TarjetaHabitacion";

// La página consulta la base de datos en cada visita, así siempre muestra
// las habitaciones activas sin necesidad de volver a publicar el sitio.
export const dynamic = "force-dynamic";

export default async function Inicio() {
  // Un componente de servidor puede leer la base de datos directamente:
  // no necesita llamar a nuestra propia API con fetch.
  let habitaciones: HabitacionPublica[] = [];
  let error = false;
  try {
    habitaciones = await obtenerHabitaciones();
  } catch (e) {
    console.error("Error al cargar habitaciones:", e);
    error = true;
  }

  return (
    <main>
      <section className="relative overflow-hidden bg-rio-oscuro pb-28 pt-36 text-white sm:pb-36 sm:pt-44">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-sm font-medium text-sol">Montería, Córdoba</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Descansa a pocas cuadras del río Sinú
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            Elige tu habitación, revisa la disponibilidad para tus fechas y confirma tu reserva por WhatsApp, sin
            esperas ni llamadas.
          </p>
          <a
            href="#habitaciones"
            className="mt-10 inline-flex rounded-full bg-sol px-6 py-3 font-semibold text-rio-oscuro transition-colors hover:bg-white"
          >
            Ver habitaciones
          </a>
        </div>

        {/* El río: una línea ondulada que cruza el encabezado */}
        <svg
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 w-full sm:h-32"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path d="M0 70 C 240 20, 480 110, 720 64 S 1200 20, 1440 60 L1440 120 L0 120 Z" className="fill-papel" />
          <path
            d="M0 52 C 240 2, 480 92, 720 46 S 1200 2, 1440 42"
            fill="none"
            className="stroke-sol/70"
            strokeWidth="2"
          />
        </svg>
      </section>

      <section id="habitaciones" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Nuestras habitaciones</h2>
        <p className="mt-3 max-w-xl text-niebla">
          Todas incluyen desayuno, aire acondicionado y Wi-Fi. Elige una para ver sus detalles.
        </p>

        {error ? (
          <p role="alert" className="mt-10 rounded-xl border border-linea bg-white p-6">
            No pudimos cargar las habitaciones en este momento. Recarga la página en unos segundos.
          </p>
        ) : habitaciones.length === 0 ? (
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
      </section>
    </main>
  );
}
