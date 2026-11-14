// Lo usa routes/devolucion.routes.js a través de validate.middleware.js.
const { z } = require("zod");

const crearDevolucionSchema = z.object({
  transmisionId: z.coerce.number().int().positive("Debes indicar la transmisión"),
  monto: z.coerce
    .number()
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
  fecha: z.coerce
    .date({ message: "La fecha no es válida" })
    .refine((fecha) => fecha <= new Date(), { message: "La fecha de la devolución no puede ser futura" }),
  medio: z.enum(["TRANSFERENCIA", "EFECTIVO"], { message: "El medio debe ser TRANSFERENCIA o EFECTIVO" }),
});

module.exports = { crearDevolucionSchema };