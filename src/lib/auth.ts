import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { conectarDB } from "./db";
import { COOKIE_SESION, verificarSesion, type Sesion } from "./sesion";
import { Usuario } from "@/models/Usuario";

// Hash de una contraseña cualquiera. Se compara contra él cuando el correo no
// existe, para que la respuesta tarde lo mismo y no revele qué correos están registrados.
const HASH_FALSO = "$2b$12$2jGXC7DVOBNRNoAOLIJ/8O2ggploUgRaZ6VVw6CM1ViBcTHEyEemy";

/** Comprueba correo y contraseña. Devuelve la sesión o null, sin decir cuál de los dos falló. */
export async function verificarCredenciales(email: string, password: string): Promise<Sesion | null> {
  await conectarDB();
  const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() }).lean();
  const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_FALSO);
  if (!usuario || !coincide) return null;
  return { id: usuario._id.toString(), nombre: usuario.nombre, email: usuario.email };
}

/** Sesión del usuario actual en componentes de servidor y rutas de la API. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value);
}
