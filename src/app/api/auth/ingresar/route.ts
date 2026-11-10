import { NextResponse } from "next/server";
import { z } from "zod";
import { verificarCredenciales } from "@/lib/auth";
import { COOKIE_SESION, firmarSesion, opcionesCookie } from "@/lib/sesion";

export const dynamic = "force-dynamic";

const ingresoSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

// POST /api/auth/ingresar: valida credenciales y crea la cookie de sesión
export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null);
  const validacion = ingresoSchema.safeParse(cuerpo);
  if (!validacion.success) {
    return NextResponse.json({ mensaje: "Escribe tu correo y tu contraseña" }, { status: 400 });
  }

  try {
    const sesion = await verificarCredenciales(validacion.data.email, validacion.data.password);
    if (!sesion) {
      return NextResponse.json({ mensaje: "Correo o contraseña incorrectos" }, { status: 401 });
    }
    const respuesta = NextResponse.json({ nombre: sesion.nombre });
    respuesta.cookies.set(COOKIE_SESION, await firmarSesion(sesion), opcionesCookie);
    return respuesta;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json({ mensaje: "No se pudo iniciar sesión. Inténtalo de nuevo." }, { status: 500 });
  }
}
