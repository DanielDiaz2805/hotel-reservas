import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/auth";
import { cambiarEstado } from "@/lib/panel";

export const dynamic = "force-dynamic";

const cambioSchema = z.object({ estado: z.enum(["confirmada", "cancelada"]) });

// PATCH /api/panel/reservas/:id  { "estado": "confirmada" | "cancelada" }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const { id } = await params;
  const validacion = cambioSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json({ mensaje: 'El estado debe ser "confirmada" o "cancelada"' }, { status: 400 });
  }

  try {
    const resultado = await cambiarEstado(id, validacion.data.estado);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json(resultado.reserva);
  } catch (error) {
    console.error("Error al cambiar el estado:", error);
    return NextResponse.json({ mensaje: "No se pudo actualizar la reserva" }, { status: 500 });
  }
}
