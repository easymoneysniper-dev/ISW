// Esquemas de validación con Zod para los costos fijos del mes (M4, requisito 4.3).
// Lo usa routes/costoFijo.routes.js a través de validate.middleware.js.
const { z } = require("zod");

const anio = z.coerce
  .number({ message: "El año no es válido" })
  .int("El año no es válido")
  .min(2020, "El año no es válido")
  .max(2100, "El año no es válido");

const mes = z.coerce
  .number({ message: "El mes no es válido" })
  .int("El mes no es válido")
  .min(1, "El mes debe estar entre 1 y 12")
  .max(12, "El mes debe estar entre 1 y 12");

// GET /api/costos-fijos?anio=2026&mes=11
const periodoQuerySchema = z.object({ anio, mes });

const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El id debe ser un número positivo"),
});

const crearCostoFijoSchema = z.object({
  nombre: z
    .string({ message: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  monto: z.coerce
    .number({ message: "El monto debe ser un número" })
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
  anio,
  mes,
});

module.exports = {
  periodoQuerySchema,
  idParamSchema,
  crearCostoFijoSchema,
};
