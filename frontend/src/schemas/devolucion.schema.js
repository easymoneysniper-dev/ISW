// Reglas del formulario de la devolución del adelanto.
// Son las mismas del backend (backend/src/schemas/devolucion.schema.js) para avisar antes de enviar.
import { z } from "zod";
import { comprobanteSchema, fechaNoFutura } from "./comprobante.schema";

export const crearDevolucionSchema = z.object({
  monto: z.coerce
    .number({ message: "El monto debe ser un número" })
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
  fecha: fechaNoFutura(
    "Indica la fecha en que se devolvió el adelanto",
    "La fecha de la devolución no puede ser futura"
  ),
  medio: z.enum(["TRANSFERENCIA", "EFECTIVO"], { message: "Elige el medio de pago" }),
  comprobante: comprobanteSchema,
});