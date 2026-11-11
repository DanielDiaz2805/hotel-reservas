import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { fotoPermitida } from "@/lib/cloudinary";
import { esquemaHabitacion } from "@/lib/habitacion-reglas";
import { crearHabitacion } from "@/lib/habitaciones-admin";
import { erroresPorCampo } from "@/lib/validacion";

export const dynamic = "force-dynamic";

// POST /api/panel/habitaciones: crea una habitación
export async function POST(request: Request) {
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }

  const validacion = esquemaHabitacion.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Revisa los datos de la habitación", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }
  if (!validacion.data.imagenes.every(fotoPermitida)) {
    return NextResponse.json(
      { mensaje: "Revisa los datos de la habitación", errores: { imagenes: "Una de las fotos no es válida" } },
      { status: 400 }
    );
  }

  try {
    const resultado = await crearHabitacion(validacion.data);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json(resultado.habitacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear la habitación:", error);
    return NextResponse.json({ mensaje: "No se pudo crear la habitación" }, { status: 500 });
  }
}
