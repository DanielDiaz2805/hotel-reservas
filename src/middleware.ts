import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/sesion";

/**
 * Protege el panel y su API antes de que la petición llegue a la página.
 * Sin sesión válida: las páginas redirigen al inicio de sesión y la API responde 401.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sesion = await verificarSesion(request.cookies.get(COOKIE_SESION)?.value);
  if (sesion) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  const destino = new URL("/ingresar", request.url);
  destino.searchParams.set("siguiente", pathname + search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/panel/:path*", "/api/panel/:path*"],
};
