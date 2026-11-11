import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { fotoPermitida } from "@/lib/cloudinary";
import { esquemaCambioHabitacion } from "@/lib/habitacion-reglas";
import { actualizarHabitacion, eliminarHabitacion } from "@/lib/habitaciones-admin";
import { erroresPorCampo } from "@/lib/validacion";

export const dynamic = "force-dynamic";

// PATCH /api/panel/habitaciones/:id: edita una habitación (envía solo los campos que cambian)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const { id } = await params;

  const validacion = esquemaCambioHabitacion.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Revisa los datos de la habitación", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }
  if (Object.keys(validacion.data).length === 0) {
    return NextResponse.json({ mensaje: "No hay cambios para guardar" }, { status: 400 });
  }
  if (validacion.data.imagenes && !validacion.data.imagenes.every(fotoPermitida)) {
    return NextResponse.json(
      { mensaje: "Revisa los datos de la habitación", errores: { imagenes: "Una de las fotos no es válida" } },
      { status: 400 }
    );
  }

  try {
    const resultado = await actualizarHabitacion(id, validacion.data);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json(resultado.habitacion);
  } catch (error) {
    console.error("Error al actualizar la habitación:", error);
    return NextResponse.json({ mensaje: "No se pudo guardar la habitación" }, { status: 500 });
  }
}

// DELETE /api/panel/habitaciones/:id: borra una habitación que nunca tuvo reservas
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const resultado = await eliminarHabitacion(id);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ mensaje: "Habitación eliminada" });
  } catch (error) {
    console.error("Error al eliminar la habitación:", error);
    return NextResponse.json({ mensaje: "No se pudo eliminar la habitación" }, { status: 500 });
  }
}
