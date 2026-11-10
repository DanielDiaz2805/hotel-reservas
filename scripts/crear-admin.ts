/**
 * Crea o actualiza un usuario administrador del panel.
 * Uso: npm run crear-admin -- correo@ejemplo.com "Nombre Apellido" "contraseña"
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { conectarDB } from "../src/lib/db";
import { Usuario } from "../src/models/Usuario";

async function main() {
  const [email, nombre, password] = process.argv.slice(2);
  if (!email || !nombre || !password) {
    console.error('Uso: npm run crear-admin -- correo@ejemplo.com "Nombre Apellido" "contraseña"');
    process.exitCode = 1;
    return;
  }
  if (password.length < 10) {
    console.error("La contraseña debe tener al menos 10 caracteres.");
    process.exitCode = 1;
    return;
  }

  await conectarDB();
  // 12 rondas: lento a propósito para que adivinar contraseñas por fuerza bruta sea costoso
  const passwordHash = await bcrypt.hash(password, 12);
  await Usuario.updateOne(
    { email: email.toLowerCase() },
    { $set: { nombre, email: email.toLowerCase(), passwordHash, rol: "admin" } },
    { upsert: true }
  );
  console.log(`✔ Administrador listo: ${nombre} <${email.toLowerCase()}>`);
}

main()
  .catch((error) => {
    console.error("Error al crear el administrador:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
