import { NextResponse, type NextRequest } from "next/server";
import { busquedaSchema, erroresPorCampo } from "@/lib/validacion";
import { habitacionesDisponibles } from "@/lib/reservas";

export const dynamic = "force-dynamic";

// GET /api/disponibilidad?llegada=2026-12-15&salida=2026-12-18&huespedes=2
export async function GET(request: NextRequest) {
  const parametros = Object.fromEntries(request.nextUrl.searchParams);
  const validacion = busquedaSchema.safeParse(parametros);
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Datos de búsqueda inválidos", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }

  const { llegada, salida, huespedes } = validacion.data;
  try {
    const habitaciones = await habitacionesDisponibles(llegada, salida, huespedes);
    return NextResponse.json({ llegada, salida, huespedes, total: habitaciones.length, habitaciones });
  } catch (error) {
    console.error("Error al consultar disponibilidad:", error);
    return NextResponse.json({ mensaje: "No se pudo consultar la disponibilidad" }, { status: 500 });
  }
}
