import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const TIPOS_HABITACION = ["sencilla", "doble", "familiar", "suite"] as const;

const habitacionSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    // Identificador legible para la URL: /habitaciones/doble-vista-jardin
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tipo: { type: String, required: true, enum: TIPOS_HABITACION },
    descripcion: { type: String, required: true, trim: true },
    capacidad: { type: Number, required: true, min: 1, max: 10 },
    camas: { type: String, required: true, trim: true },
    // Precio por noche en pesos colombianos, sin decimales
    precioNoche: { type: Number, required: true, min: 0 },
    comodidades: { type: [String], default: [] },
    imagenes: { type: [String], default: [] },
    // Permite retirar una habitación de la web (por mantenimiento) sin borrarla
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type HabitacionDoc = InferSchemaType<typeof habitacionSchema>;

// En desarrollo Next.js recarga este archivo; si el modelo ya existe, se reutiliza
export const Habitacion =
  (models.Habitacion as Model<HabitacionDoc>) ||
  model<HabitacionDoc>("Habitacion", habitacionSchema, "habitaciones");
