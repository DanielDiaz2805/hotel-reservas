import mongoose from "mongoose";

type CacheConexion = {
  conexion: typeof mongoose | null;
  promesa: Promise<typeof mongoose> | null;
};

// Next.js recarga el código constantemente en desarrollo, y en producción
// cada petición puede ejecutarse en una función nueva. Guardamos la conexión
// en una variable global para reutilizarla en lugar de abrir una nueva cada vez.
const global = globalThis as unknown as { mongoose?: CacheConexion };
const cache: CacheConexion = global.mongoose ?? (global.mongoose = { conexion: null, promesa: null });

export async function conectarDB() {
  if (cache.conexion) return cache.conexion;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta la variable MONGODB_URI en el archivo .env.local");
  }

  if (!cache.promesa) {
    cache.promesa = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cache.conexion = await cache.promesa;
  } catch (error) {
    cache.promesa = null; // permite reintentar en la siguiente petición
    throw error;
  }

  return cache.conexion;
}