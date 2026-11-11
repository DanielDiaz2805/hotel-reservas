import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { cloudinaryConfigurado, firmarSubida } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// POST /api/panel/subida: entrega la firma para subir fotos directo a Cloudinary
export async function POST() {
  if (!(await obtenerSesion())) {
    return NextResponse.json({ mensaje: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!cloudinaryConfigurado()) {
    return NextResponse.json({ mensaje: "La subida de fotos no está configurada" }, { status: 503 });
  }
  return NextResponse.json(firmarSubida());
}
