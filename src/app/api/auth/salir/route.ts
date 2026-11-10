import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion";

// POST /api/auth/salir: elimina la cookie de sesión
export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.delete(COOKIE_SESION);
  return respuesta;
}
