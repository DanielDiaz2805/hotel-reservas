import type { Metadata } from "next";
import Link from "next/link";
import { listarHabitacionesAdmin } from "@/lib/habitaciones-admin";
import { hoyEnColombia } from "@/lib/fechas";
import { IconoCama } from "@/components/panel/Iconos";
import { clasesBoton } from "@/components/panel/ui/Boton";
import { EstadoVacio } from "@/components/panel/ui/EstadoVacio";
import { TarjetaHabitacionPanel } from "@/components/panel/habitaciones/TarjetaHabitacionPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Habitaciones" };

export default async function Habitaciones() {
  const habitaciones = await listarHabitacionesAdmin(hoyEnColombia());
  const visibles = habitaciones.filter((h) => h.activa).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 animate-subir">
        <div>
          <h1 className="font-display text-3xl font-semibold">Habitaciones</h1>
          <p className="mt-1 text-niebla">
            {habitaciones.length === 0
              ? "Aquí administras lo que ven tus huéspedes en la web."
              : `${habitaciones.length} en total, ${visibles} visibles en la web.`}
          </p>
        </div>
        <Link href="/panel/habitaciones/nueva" className={clasesBoton("primario")}>
          Nueva habitación
        </Link>
      </div>

      <div className="mt-8">
        {habitaciones.length === 0 ? (
          <EstadoVacio
            titulo="Aún no tienes habitaciones"
            descripcion="Crea la primera con su foto y su precio, y aparecerá en la web para que los huéspedes la reserven."
            icono={<IconoCama />}
          >
            <Link href="/panel/habitaciones/nueva" className={clasesBoton("primario")}>
              Crear la primera habitación
            </Link>
          </EstadoVacio>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {habitaciones.map((h, i) => (
              <div key={h.id} className="animate-subir" style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}>
                <TarjetaHabitacionPanel h={h} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
