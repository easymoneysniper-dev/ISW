const { z } = require("zod");

const transmisionIdParamSchema = z.object({
  transmisionId: z.coerce.number().int().positive("El id de la transmisión debe ser un número positivo"),
});

const crearPagoSchema = z.object({
  transmisionId: z.coerce.number().int().positive("Debes indicar la transmisión"),
  tipo: z.enum(["ADELANTO", "SALDO"], { message: "El tipo debe ser ADELANTO o SALDO" }),
  monto: z.coerce
    .number()
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
  fecha: z.coerce.date({ message: "La fecha no es válida" }),
  medio: z.string().trim().max(50).optional().nullable(),
  observacion: z.string().trim().max(300).optional().nullable(),
});

module.exports = {
  transmisionIdParamSchema,
  crearPagoSchema,
};