import { z } from "zod";
import { esFechaValida, hoyEnColombia, contarNoches, MAX_NOCHES } from "./fechas";

const fecha = z.string().refine(esFechaValida, "Fecha inválida");

/** Reglas de las fechas, compartidas por la búsqueda y la reserva. */
export const rangoFechas = z
  .object({ llegada: fecha, salida: fecha })
  .refine((d) => d.llegada >= hoyEnColombia(), {
    message: "La fecha de llegada no puede ser anterior a hoy",
    path: ["llegada"],
  })
  .refine((d) => d.salida > d.llegada, {
    message: "La salida debe ser posterior a la llegada",
    path: ["salida"],
  })
  .refine((d) => contarNoches(d.llegada, d.salida) <= MAX_NOCHES, {
    message: `Puedes reservar máximo ${MAX_NOCHES} noches`,
    path: ["salida"],
  });

export const busquedaSchema = rangoFechas.and(
  z.object({ huespedes: z.coerce.number().int().min(1).max(10) })
);

export const reservaSchema = rangoFechas.and(
  z.object({
    habitacion: z.string().min(1, "Falta la habitación"),
    huespedes: z.coerce.number().int().min(1, "Mínimo 1 huésped").max(10),
    nombre: z.string().trim().min(3, "Escribe tu nombre completo").max(80),
    // Celular colombiano: 10 dígitos que empiezan por 3. Se aceptan espacios y el +57.
    telefono: z
      .string()
      .transform((t) => t.replace(/[\s-]/g, "").replace(/^\+?57/, ""))
      .pipe(z.string().regex(/^3\d{9}$/, "Escribe un celular colombiano de 10 dígitos, por ejemplo 3001234567")),
    notas: z.string().trim().max(300).optional().default(""),
  })
);

export type DatosReserva = z.infer<typeof reservaSchema>;

/** Convierte los errores de Zod en { campo: "mensaje" } para mostrarlos en el formulario. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "general");
    resultado[campo] ??= issue.message;
  }
  return resultado;
}
