import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Datos editables del hotel. Hay un solo documento, identificado por la clave "hotel". */
const configuracionSchema = new Schema(
  {
    clave: { type: String, required: true, unique: true, default: "hotel" },
    nombre: { type: String, required: true },
    nombreCorto: { type: String, required: true },
    ciudad: { type: String, required: true },
    whatsapp: { type: String, default: "" }, // 10 dígitos o vacío
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    tituloPrincipal: { type: String, required: true },
    descripcionPrincipal: { type: String, required: true },
    notaPie: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ConfiguracionDoc = InferSchemaType<typeof configuracionSchema>;

export const Configuracion =
  (models.Configuracion as Model<ConfiguracionDoc>) || model<ConfiguracionDoc>("Configuracion", configuracionSchema, "configuracion");
