import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Nunca se guarda la contraseña: solo su hash con bcrypt
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ["admin"], default: "admin" },
  },
  { timestamps: true }
);

export type UsuarioDoc = InferSchemaType<typeof usuarioSchema>;

export const Usuario =
  (models.Usuario as Model<UsuarioDoc>) || model<UsuarioDoc>("Usuario", usuarioSchema, "usuarios");
