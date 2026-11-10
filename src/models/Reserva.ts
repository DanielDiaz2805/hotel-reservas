import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ESTADOS_RESERVA = ["pendiente", "confirmada", "cancelada"] as const;

const reservaSchema = new Schema(
  {
    // Código corto que el huésped puede dictar por teléfono o WhatsApp: BS-7K2M9Q
    codigo: { type: String, required: true, unique: true },
    habitacion: { type: Schema.Types.ObjectId, ref: "Habitacion", required: true },
    // Copia del nombre y precio al momento de reservar: si el hotel cambia
    // el precio mañana, esta reserva conserva el que se le ofreció al huésped.
    nombreHabitacion: { type: String, required: true },
    precioNoche: { type: Number, required: true },
    llegada: { type: String, required: true }, // AAAA-MM-DD
    salida: { type: String, required: true },
    noches: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    huespedes: { type: Number, required: true, min: 1 },
    huesped: {
      nombre: { type: String, required: true, trim: true },
      telefono: { type: String, required: true },
    },
    notas: { type: String, default: "" },
    estado: { type: String, enum: ESTADOS_RESERVA, default: "pendiente" },
  },
  { timestamps: true }
);

reservaSchema.index({ llegada: 1 });

export type ReservaDoc = InferSchemaType<typeof reservaSchema>;

export const Reserva =
  (models.Reserva as Model<ReservaDoc>) || model<ReservaDoc>("Reserva", reservaSchema, "reservas");
