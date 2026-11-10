import mongoose from "mongoose";

type CacheConexion = {
  conexion: typeof mongoose | null;
  promesa: Promise<typeof mongoose> | null;
};

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
    cache.promesa = null;
    throw error;
  }

  return cache.conexion;
}
