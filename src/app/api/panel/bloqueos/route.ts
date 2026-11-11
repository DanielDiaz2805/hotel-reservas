import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { crearBloqueo } from "@/lib/calendario";
import { hoyEnColombia } from "@/lib/fechas";
import { bloqueoSchema, erroresPorCampo } from "@/lib/validacion";

export const dynamic = "force-dynamic";

// POST /api/panel/bloqueos { habitacion, desde, ultimoDia, motivo }
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });

  const validacion = bloqueoSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json({ mensaje: "Revisa los datos marcados", errores: erroresPorCampo(validacion.error) }, { status: 400 });
  }
  try {
    const resultado = await crearBloqueo(validacion.data, hoyEnColombia(), sesion.nombre);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ id: resultado.id }, { status: 201 });
  } catch (error) {
    console.error("Error al crear el bloqueo:", error);
    return NextResponse.json({ mensaje: "No se pudo bloquear las fechas" }, { status: 500 });
  }
}
