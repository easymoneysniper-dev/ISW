// Reglas del formulario de costos fijos (Clase 7: React Hook Form + Zod).
// Son las mismas del backend (backend/src/schemas/costoFijo.schema.js). El mes y el año
// vienen del selector de la pantalla, por eso no están aquí.
import { z } from "zod";

export const crearCostoFijoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  monto: z.coerce
    .number({ message: "El monto debe ser un número" })
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
});
