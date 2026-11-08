// Reglas del formulario de pagos (Clase 7: React Hook Form + Zod).
// MER v3.1: medio Transferencia o Efectivo, sin observación.
// Son las mismas del backend (backend/src/schemas/pago.schema.js) para avisar antes de enviar.
import { z } from "zod";
import { comprobanteSchema, fechaNoFutura } from "./comprobante.schema";

export const crearPagoSchema = z.object({
  tipo: z.enum(["ADELANTO", "SALDO"], { message: "El tipo debe ser ADELANTO o SALDO" }),
  monto: z.coerce
    .number({ message: "El monto debe ser un número" })
    .int("El monto va en pesos, sin decimales")
    .positive("El monto debe ser mayor a 0"),
  fecha: fechaNoFutura(
    "Indica la fecha en que se recibió el pago",
    "La fecha de recepción no puede ser futura"
  ),
  medio: z.enum(["TRANSFERENCIA", "EFECTIVO"], { message: "Elige el medio de pago" }),
  comprobante: comprobanteSchema,
});