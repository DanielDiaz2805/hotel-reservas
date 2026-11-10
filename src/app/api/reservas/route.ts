import { NextResponse } from "next/server";
import { reservaSchema, erroresPorCampo } from "@/lib/validacion";
import { crearReserva } from "@/lib/reservas";

export const dynamic = "force-dynamic";

// POST /api/reservas: crea una reserva en estado "pendiente"
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ mensaje: "El cuerpo de la petición debe ser JSON" }, { status: 400 });
  }

  const validacion = reservaSchema.safeParse(cuerpo);
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Revisa los datos de la reserva", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }

  try {
    const resultado = await crearReserva(validacion.data);
    if (!resultado.ok) {
      return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    }
    return NextResponse.json(resultado.reserva, { status: 201 });
  } catch (error) {
    console.error("Error al crear la reserva:", error);
    return NextResponse.json({ mensaje: "No se pudo crear la reserva. Inténtalo de nuevo." }, { status: 500 });
  }
}
