import { createHash } from "node:crypto";

/**
 * Subida de fotos a Cloudinary con firma.
 * El navegador sube la foto directo a Cloudinary (así no pasa por los límites de tamaño de Vercel),
 * pero solo puede hacerlo con una firma que genera este servidor para un usuario con sesión.
 * El API Secret nunca sale del servidor.
 */

export const CARPETA_FOTOS = "hotel/habitaciones";
export const FORMATOS_PERMITIDOS = "jpg,jpeg,png,webp";

export function cloudinaryConfigurado(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** true si la dirección es una foto de NUESTRA cuenta de Cloudinary */
export function fotoPermitida(url: string): boolean {
  const nube = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(nube) && url.startsWith(`https://res.cloudinary.com/${nube}/`);
}

export type FirmaSubida = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

/** Genera la firma que autoriza una subida durante aproximadamente una hora. */
export function firmarSubida(): FirmaSubida {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secreto = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secreto) throw new Error("Cloudinary no está configurado");

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary firma los parámetros ordenados alfabéticamente: "a=1&b=2" + secreto, con SHA-1
  const parametros: Record<string, string> = {
    allowed_formats: FORMATOS_PERMITIDOS,
    folder: CARPETA_FOTOS,
    timestamp: String(timestamp),
  };
  const texto = Object.keys(parametros)
    .sort()
    .map((clave) => `${clave}=${parametros[clave]}`)
    .join("&");
  const signature = createHash("sha1").update(texto + secreto).digest("hex");

  return { cloudName, apiKey, timestamp, signature, folder: CARPETA_FOTOS, allowedFormats: FORMATOS_PERMITIDOS };
}
