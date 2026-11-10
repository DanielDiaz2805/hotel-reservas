import { NextResponse } from "next/server";
import { obtenerHabitacionPorSlug } from "@/lib/habitaciones";

export const dynamic = "force-dynamic";

// GET /api/habitaciones/:slug: detalle de una habitación
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const habitacion = await obtenerHabitacionPorSlug(slug);
    if (!habitacion) {
      return NextResponse.json({ mensaje: `No existe la habitación "${slug}"` }, { status: 404 });
    }
    return NextResponse.json(habitacion);
  } catch (error) {
    console.error("Error al obtener la habitación:", error);
    return NextResponse.json({ mensaje: "No se pudo cargar la habitación" }, { status: 500 });
  }
}
