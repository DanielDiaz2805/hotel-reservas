import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { eliminarBloqueo } from "@/lib/calendario";

export const dynamic = "force-dynamic";

// DELETE /api/panel/bloqueos/:id — libera las fechas bloqueadas
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  const { id } = await params;
  try {
    const resultado = await eliminarBloqueo(id);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al quitar el bloqueo:", error);
    return NextResponse.json({ mensaje: "No se pudo quitar el bloqueo" }, { status: 500 });
  }
}
