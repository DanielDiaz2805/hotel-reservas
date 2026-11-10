import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { esEstado, listarReservas } from "@/lib/panel";

export const dynamic = "force-dynamic";

// GET /api/panel/reservas?estado=pendiente (requiere sesión)
export async function GET(request: NextRequest) {
  // El middleware ya bloquea sin sesión; esta comprobación es una segunda capa
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const parametro = request.nextUrl.searchParams.get("estado");
  if (parametro && !esEstado(parametro)) {
    return NextResponse.json({ mensaje: "Estado inválido" }, { status: 400 });
  }
  const estado = esEstado(parametro) ? parametro : undefined;
  try {
    const reservas = await listarReservas(estado);
    return NextResponse.json({ total: reservas.length, reservas });
  } catch (error) {
    console.error("Error al listar reservas:", error);
    return NextResponse.json({ mensaje: "No se pudieron cargar las reservas" }, { status: 500 });
  }
}
