import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { conectarDB } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/salud: confirma que la aplicación puede hablar con la base de datos
export async function GET() {
  try {
    await conectarDB();
    return NextResponse.json({
      estado: "ok",
      baseDeDatos: mongoose.connection.name,
    });
  } catch (error) {
    console.error("Error de conexión a MongoDB:", error);
    return NextResponse.json(
      { estado: "error", mensaje: "No se pudo conectar a la base de datos" },
      { status: 500 }
    );
  }
}