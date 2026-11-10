// Esquemas de validación con Zod para los pagos del cliente (requisito 4.1, MER final).
// Lo usa routes/pago.routes.js a través de validate.middleware.js.
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
  fecha: z.coerce
    .date({ message: "La fecha no es válida" })
    .refine((fecha) => fecha <= new Date(), { message: "La fecha de recepción no puede ser futura" }),
  // Obligatorio en el schema del grupo (Pago.medio).
  medio: z.enum(["TRANSFERENCIA", "EFECTIVO"], { message: "El medio debe ser TRANSFERENCIA o EFECTIVO" }),
});

module.exports = {
  transmisionIdParamSchema,
  crearPagoSchema,
};
