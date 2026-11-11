import type { Metadata } from "next";
import Link from "next/link";
import { esFechaValida, hoyEnColombia, sumarDias } from "@/lib/fechas";
import { FormularioReservaPanel } from "@/components/panel/reservas/FormularioReservaPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva reserva" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NuevaReserva({ searchParams }: Props) {
  const parametros = await searchParams;
  const texto = (clave: string) => (typeof parametros[clave] === "string" ? (parametros[clave] as string) : "");
  const hoy = hoyEnColombia();
  // Al llegar desde el calendario, el formulario ya trae la habitación y el día tocados
  const llegada = esFechaValida(texto("llegada")) && texto("llegada") >= hoy ? texto("llegada") : undefined;
  const habitacion = /^[a-f0-9]{24}$/.test(texto("habitacion")) ? texto("habitacion") : undefined;

  return (
    <>
      <Link href={llegada ? "/panel/calendario" : "/panel/reservas"} className="group inline-flex items-center gap-1 text-sm font-medium text-rio">
        <span className="transition-transform group-hover:-translate-x-1">←</span> {llegada ? "Calendario" : "Reservas"}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold animate-subir">Nueva reserva</h1>
      <p className="mt-1 text-niebla">Para huéspedes que reservan por llamada, WhatsApp o en el mostrador.</p>
      <div className="mt-8">
        <FormularioReservaPanel
          hoy={hoy}
          manana={sumarDias(hoy, 1)}
          llegadaInicial={llegada}
          salidaInicial={llegada ? sumarDias(llegada, 1) : undefined}
          habitacionInicial={habitacion}
        />
      </div>
    </>
  );
}
