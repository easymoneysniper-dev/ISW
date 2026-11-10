// Reglas del formulario de gastos (Clase 7: React Hook Form + Zod).
// Son las mismas del backend (backend/src/schemas/gasto.schema.js) para avisar antes de enviar.
import { z } from "zod";
import { comprobanteSchema, fechaNoFutura } from "./comprobante.schema";

export const CATEGORIAS_GASTO = ["MOVILIZACION", "PEAJE", "ALIMENTACION", "OTRO"];

export const crearGastoSchema = z
  .object({
    categoria: z.enum(CATEGORIAS_GASTO, { message: "Elige la categoría del gasto" }),
    monto: z.coerce
      .number({ message: "El monto debe ser un número" })
      .int("El monto va en pesos, sin decimales")
      .positive("El monto debe ser mayor a 0"),
    fecha: fechaNoFutura("Indica la fecha del gasto", "La fecha del gasto no puede ser futura"),
    observacion: z
      .string()
      .trim()
      .max(300, "La observación no puede superar los 300 caracteres")
      .optional(),
    origen: z.string().trim().max(250, "El origen no puede superar los 250 caracteres").optional(),
    destino: z.string().trim().max(250, "El destino no puede superar los 250 caracteres").optional(),
    comprobante: comprobanteSchema,
  })
  // Requisito 4.2: en la movilización hay que indicar el origen y el destino del viaje.
  .refine((gasto) => gasto.categoria !== "MOVILIZACION" || gasto.origen, {
    message: "En la movilización debes indicar el origen",
    path: ["origen"],
  })
  .refine((gasto) => gasto.categoria !== "MOVILIZACION" || gasto.destino, {
    message: "En la movilización debes indicar el destino",
    path: ["destino"],
  });
