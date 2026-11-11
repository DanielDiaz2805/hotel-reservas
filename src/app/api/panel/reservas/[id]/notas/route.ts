import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/auth";
import { agregarNota, eliminarNota } from "@/lib/panel";

export const dynamic = "force-dynamic";

const notaSchema = z.object({
  texto: z.string().trim().min(1, "Escribe la nota").max(500, "La nota admite máximo 500 caracteres"),
});
const borrarSchema = z.object({ notaId: z.string().min(1) });

// POST /api/panel/reservas/:id/notas  { "texto": "..." }: agrega una nota interna
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  const { id } = await params;

  const validacion = notaSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) {
    return NextResponse.json({ mensaje: validacion.error.issues[0]?.message ?? "La nota no es válida" }, { status: 400 });
  }

  try {
    const resultado = await agregarNota(id, validacion.data.texto, sesion.nombre);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ notas: resultado.notas }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar la nota:", error);
    return NextResponse.json({ mensaje: "No se pudo guardar la nota" }, { status: 500 });
  }
}

// DELETE /api/panel/reservas/:id/notas  { "notaId": "..." }: borra una nota interna
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obtenerSesion())) return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  const { id } = await params;

  const validacion = borrarSchema.safeParse(await request.json().catch(() => null));
  if (!validacion.success) return NextResponse.json({ mensaje: "Falta indicar qué nota borrar" }, { status: 400 });

  try {
    const resultado = await eliminarNota(id, validacion.data.notaId);
    if (!resultado.ok) return NextResponse.json({ mensaje: resultado.mensaje }, { status: resultado.status });
    return NextResponse.json({ notas: resultado.notas });
  } catch (error) {
    console.error("Error al borrar la nota:", error);
    return NextResponse.json({ mensaje: "No se pudo borrar la nota" }, { status: 500 });
  }
}
