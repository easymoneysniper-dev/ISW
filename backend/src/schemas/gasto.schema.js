// Esquemas de validación con Zod para los gastos de una transmisión (M4, requisito 4.2).
// Lo usa routes/gasto.routes.js a través de validate.middleware.js.
const { z } = require("zod");

const CATEGORIAS = ["MOVILIZACION", "PEAJE", "ALIMENTACION", "OTRO"]; // MER v3.1

const transmisionIdParamSchema = z.object({
  transmisionId: z.coerce.number().int().positive("El id de la transmisión debe ser un número positivo"),
});

// Los campos de texto vacíos llegan como "" desde el formulario: se guardan como null.
function textoOpcional(maximo, nombre) {
  return z
    .string()
    .trim()
    .max(maximo, `${nombre} no puede superar los ${maximo} caracteres`)
    .optional()
    .nullable()
    .transform((texto) => texto || null);
}

const crearGastoSchema = z
  .object({
    transmisionId: z.coerce.number().int().positive("Debes indicar la transmisión"),
    categoria: z.enum(CATEGORIAS, { message: "La categoría no es válida" }),
    monto: z.coerce
      .number()
      .int("El monto va en pesos, sin decimales")
      .positive("El monto debe ser mayor a 0"),
    fecha: z.coerce
      .date({ message: "La fecha no es válida" })
      .refine((fecha) => fecha <= new Date(), { message: "La fecha del gasto no puede ser futura" }),
    observacion: textoOpcional(300, "La observación"),
    origen: textoOpcional(250, "El origen"),
    destino: textoOpcional(250, "El destino"),
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

module.exports = {
  transmisionIdParamSchema,
  crearGastoSchema,
};
