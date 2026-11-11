import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Una noche ocupada de una habitación.
 *
 * Es la pieza que impide las reservas dobles: el índice único sobre
 * (habitacion, fecha) hace que MongoDB rechace guardar dos veces la misma
 * noche de la misma habitación, incluso si dos personas reservan al mismo
 * tiempo. La regla no depende de que el código "revise primero": la garantiza
 * la base de datos.
 */
const ocupacionSchema = new Schema({
  habitacion: { type: Schema.Types.ObjectId, ref: "Habitacion", required: true },
  fecha: { type: String, required: true }, // AAAA-MM-DD
  // Cada noche pertenece a una reserva o a un bloqueo de fechas, nunca a ambos
  reserva: { type: Schema.Types.ObjectId, ref: "Reserva" },
  bloqueo: { type: Schema.Types.ObjectId, ref: "Bloqueo" },
});

ocupacionSchema.index({ habitacion: 1, fecha: 1 }, { unique: true });
ocupacionSchema.index({ reserva: 1 });
ocupacionSchema.index({ bloqueo: 1 });

export type OcupacionDoc = InferSchemaType<typeof ocupacionSchema>;

export const Ocupacion =
  (models.Ocupacion as Model<OcupacionDoc>) ||
  model<OcupacionDoc>("Ocupacion", ocupacionSchema, "ocupaciones");
