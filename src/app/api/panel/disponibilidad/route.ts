import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/auth";
import { habitacionesParaReserva } from "@/lib/reservas-panel";
import { esFechaValida, contarNoches, MAX_NOCHES } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const consultaSchema = z.object({
  llegada: z.string().refine(esFechaValida),
  salida: z.string().refine(esFechaValida),
  huespedes: z.coerce.number().int().min(1).max(10),
  excluir: z.string().optional(),
});

// GET /api/panel/disponibilidad?llegada=&salida=&huespedes=&excluir=<id de reserva>
export async function GET(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });

  const url = new URL(request.url);
  const validacion = consultaSchema.safeParse({
    llegada: url.searchParams.get("llegada") ?? "",
    salida: url.searchParams.get("salida") ?? "",
    huespedes: url.searchParams.get("huespedes") ?? "",
    excluir: url.searchParams.get("excluir") ?? undefined,
  });
  if (!validacion.success) return NextResponse.json({ mensaje: "Fechas o huéspedes no válidos" }, { status: 400 });
  const { llegada, salida, huespedes, excluir } = validacion.data;
  if (salida <= llegada || contarNoches(llegada, salida) > MAX_NOCHES) {
    return NextResponse.json({ mensaje: `La salida debe ser posterior a la llegada (máximo ${MAX_NOCHES} noches)` }, { status: 400 });
  }

  try {
    return NextResponse.json(await habitacionesParaReserva(llegada, salida, huespedes, excluir));
  } catch (error) {
    console.error("Error al consultar disponibilidad:", error);
    return NextResponse.json({ mensaje: "No se pudo consultar la disponibilidad" }, { status: 500 });
  }
}
