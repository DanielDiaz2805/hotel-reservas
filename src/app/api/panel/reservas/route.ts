import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { conectarDB } from "@/lib/db";
import { crearReservaManual } from "@/lib/reservas-panel";
import { erroresPorCampo, reservaPanelSchema } from "@/lib/validacion";
import { Reserva } from "@/models/Reserva";

export const dynamic = "force-dynamic";

// POST /api/panel/reservas — el personal crea una reserva (llamada, WhatsApp, mostrador)
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });

  const validacion = reservaPanelSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Revisa los datos marcados", errores: erroresPorCampo(validacion.error) },
      { status: 400 }
    );
  }

  try {
    const resultado = await crearReservaManual(validacion.data, sesion.nombre);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    // El panel necesita el id para llevar al personal directo al detalle
    await conectarDB();
    const creada = await Reserva.findOne({ codigo: resultado.reserva.codigo }, { _id: 1 }).lean();
    return NextResponse.json({ ...resultado.reserva, id: creada?._id.toString() ?? null }, { status: 201 });
  } catch (error) {
    console.error("Error al crear la reserva manual:", error);
    return NextResponse.json({ mensaje: "No se pudo crear la reserva" }, { status: 500 });
  }
}
