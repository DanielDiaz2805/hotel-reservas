import { cache } from "react";
import { conectarDB } from "./db";
import { CONFIGURACION_POR_DEFECTO, type ConfiguracionHotel, type DatosConfiguracion } from "./configuracion-reglas";
import { normalizarNumero } from "./whatsapp";
import { Configuracion } from "@/models/Configuracion";

/**
 * Datos del hotel para el sitio y el panel. Si todavía no se han guardado (o la base de datos no responde)
 * se usan los valores por defecto, así una falla de conexión nunca deja el sitio sin encabezado.
 * `cache` evita consultar la base más de una vez por visita.
 */
export const obtenerConfiguracion = cache(async (): Promise<ConfiguracionHotel> => {
  // Compatibilidad: solo mientras no se haya guardado ninguna configuración, el WhatsApp puede venir de la variable de entorno
  const whatsappEntorno = normalizarNumero(process.env.WHATSAPP_HOTEL ?? "");
  try {
    await conectarDB();
    const doc = await Configuracion.findOne({ clave: "hotel" }).lean();
    if (!doc) return { ...CONFIGURACION_POR_DEFECTO, whatsapp: whatsappEntorno };
    return {
      nombre: doc.nombre,
      nombreCorto: doc.nombreCorto,
      ciudad: doc.ciudad,
      // Si el hotel ya guardó su configuración, manda lo que escribió: vacío significa sin botón de WhatsApp
      whatsapp: doc.whatsapp ? normalizarNumero(doc.whatsapp) : null,
      checkIn: doc.checkIn,
      checkOut: doc.checkOut,
      tituloPrincipal: doc.tituloPrincipal,
      descripcionPrincipal: doc.descripcionPrincipal,
      notaPie: doc.notaPie ?? "",
    };
  } catch (error) {
    console.error("No se pudo leer la configuración del hotel:", error);
    return { ...CONFIGURACION_POR_DEFECTO, whatsapp: whatsappEntorno };
  }
});

export async function guardarConfiguracion(datos: DatosConfiguracion): Promise<void> {
  await conectarDB();
  await Configuracion.findOneAndUpdate({ clave: "hotel" }, { $set: { ...datos, clave: "hotel" } }, { upsert: true, new: true });
}
