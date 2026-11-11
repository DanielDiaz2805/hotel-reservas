import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth";
import { guardarConfiguracion } from "@/lib/configuracion";
import { configuracionSchema } from "@/lib/configuracion-reglas";
import { erroresPorCampo } from "@/lib/validacion";

export const dynamic = "force-dynamic";

// PUT /api/panel/configuracion — guarda los datos del hotel
export async function PUT(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });

  const validacion = configuracionSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json({ mensaje: "Revisa los datos marcados", errores: erroresPorCampo(validacion.error) }, { status: 400 });
  }
  try {
    await guardarConfiguracion(validacion.data);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    return NextResponse.json({ mensaje: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
