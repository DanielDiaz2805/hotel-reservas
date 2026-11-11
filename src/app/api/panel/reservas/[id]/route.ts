import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/auth";
import { cambiarEstado } from "@/lib/panel";
import { editarReserva } from "@/lib/reservas-panel";
import { erroresPorCampo, reservaPanelSchema } from "@/lib/validacion";

export const dynamic = "force-dynamic";

const cambioSchema = z.object({ estado: z.enum(["confirmada", "en_casa", "finalizada", "cancelada"]) });

// PATCH /api/panel/reservas/:id  { "estado": "confirmada" | "en_casa" | "finalizada" | "cancelada" }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const { id } = await params;
  const validacion = cambioSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json({ mensaje: "El estado no es válido" }, { status: 400 });
  }

  try {
    const resultado = await cambiarEstado(id, validacion.data.estado, sesion.nombre);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json(resultado.reserva);
  } catch (error) {
    console.error("Error al cambiar el estado:", error);
    return NextResponse.json({ mensaje: "No se pudo actualizar la reserva" }, { status: 500 });
  }
}

// PUT /api/panel/reservas/:id — modificar fechas, habitación, huéspedes, precio o datos del huésped
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const { id } = await params;
  const validacion = reservaPanelSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Revisa los datos marcados", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }

  try {
    const resultado = await editarReserva(id, validacion.data, sesion.nombre);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al modificar la reserva:", error);
    return NextResponse.json({ mensaje: "No se pudo modificar la reserva" }, { status: 500 });
  }
}
