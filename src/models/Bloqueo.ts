import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Fechas en las que una habitación no se puede reservar (mantenimiento, uso del dueño, temporada cerrada).
 * Cada noche bloqueada también existe como "Ocupacion" con referencia a este bloqueo, así la web pública
 * y el panel las tratan igual que una reserva y el índice único impide cruzarlas con una reserva.
 */
const bloqueoSchema = new Schema(
  {
    habitacion: { type: Schema.Types.ObjectId, ref: "Habitacion", required: true },
    // Primera noche bloqueada y día en que vuelve a estar libre (igual que llegada y salida de una reserva)
    desde: { type: String, required: true },
    hasta: { type: String, required: true },
    motivo: { type: String, default: "", maxlength: 80 },
    creadoPor: { type: String, default: "" },
  },
  { timestamps: true }
);

bloqueoSchema.index({ habitacion: 1, desde: 1 });
bloqueoSchema.index({ hasta: 1 });

export type BloqueoDoc = InferSchemaType<typeof bloqueoSchema>;

export const Bloqueo = (models.Bloqueo as Model<BloqueoDoc>) || model<BloqueoDoc>("Bloqueo", bloqueoSchema, "bloqueos");
