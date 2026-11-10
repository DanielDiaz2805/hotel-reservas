import { NextResponse } from "next/server";
import { obtenerHabitaciones } from "@/lib/habitaciones";

export const dynamic = "force-dynamic";

// GET /api/habitaciones: lista de habitaciones disponibles en la web
export async function GET() {
  try {
    const habitaciones = await obtenerHabitaciones();
    return NextResponse.json({ total: habitaciones.length, habitaciones });
  } catch (error) {
    console.error("Error al listar habitaciones:", error);
    return NextResponse.json({ mensaje: "No se pudieron cargar las habitaciones" }, { status: 500 });
  }
}
