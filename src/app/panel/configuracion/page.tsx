import type { Metadata } from "next";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { FormularioConfiguracion } from "@/components/panel/configuracion/FormularioConfiguracion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configuración" };

export default async function Configuracion() {
  const c = await obtenerConfiguracion();
  return (
    <>
      <div className="animate-subir">
        <h1 className="font-display text-3xl font-semibold">Configuración</h1>
        <p className="mt-1 text-niebla">Los datos del hotel que ven tus huéspedes. Los cambios se ven en la web al guardar.</p>
      </div>
      <div className="mt-8">
        <FormularioConfiguracion
          inicial={{
            nombre: c.nombre,
            nombreCorto: c.nombreCorto,
            ciudad: c.ciudad,
            whatsapp: c.whatsapp ? c.whatsapp.replace(/^57/, "") : "",
            checkIn: c.checkIn,
            checkOut: c.checkOut,
            tituloPrincipal: c.tituloPrincipal,
            descripcionPrincipal: c.descripcionPrincipal,
            notaPie: c.notaPie,
          }}
        />
      </div>
    </>
  );
}
