import { SignJWT, jwtVerify } from "jose";

/**
 * Sesiones con JWT firmado (HS256) guardado en una cookie httpOnly.
 * Este archivo no usa la base de datos para que el middleware, que corre en
 * el entorno Edge, pueda verificar la sesión en cada petición.
 */
export const COOKIE_SESION = "sesion";
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 8; // 8 horas: una jornada de recepción

export type Sesion = { id: string; nombre: string; email: string };

function clave(): Uint8Array {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("JWT_SECRET debe estar en .env.local y tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secreto);
}

export async function firmarSesion(sesion: Sesion): Promise<string> {
  return new SignJWT({ nombre: sesion.nombre, email: sesion.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sesion.id)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
    .sign(clave());
}

/** Devuelve la sesión si el token es válido y no ha expirado; si no, null. */
export async function verificarSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.nombre !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.sub, nombre: payload.nombre, email: payload.email };
  } catch {
    return null; // firma inválida, token alterado o expirado
  }
}

export const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leerla: protege contra robo por XSS
  secure: process.env.NODE_ENV === "production", // solo por HTTPS en producción
  sameSite: "lax" as const, // no se envía desde formularios de otros sitios (CSRF)
  path: "/",
  maxAge: DURACION_SESION_SEGUNDOS,
};
