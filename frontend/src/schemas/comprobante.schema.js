// Reglas comunes de los formularios de Finanzas que llevan comprobante (pagos, gastos, aportes).
// Las usan pago.schema.js y gasto.schema.js.
import { z } from "zod";

const TIPOS_COMPROBANTE = ["image/jpeg", "image/png", "application/pdf"];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// Fecha de hoy en formato AAAA-MM-DD (el mismo que entrega el input de fecha).
export function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Fecha obligatoria que no puede ser posterior a hoy.
export function fechaNoFutura(mensajeVacia, mensajeFutura) {
  return z
    .string()
    .min(1, mensajeVacia)
    .refine((fecha) => fecha <= fechaDeHoy(), mensajeFutura);
}

// El input de archivo entrega una lista; se exige exactamente uno, JPG, PNG o PDF, de hasta 5 MB.
export const comprobanteSchema = z
  .any()
  .refine((archivos) => archivos?.length === 1, "Debes adjuntar el comprobante")
  .refine(
    (archivos) => TIPOS_COMPROBANTE.includes(archivos?.[0]?.type),
    "El comprobante debe ser JPG, PNG o PDF"
  )
  .refine((archivos) => archivos?.[0]?.size <= TAMANO_MAXIMO, "El comprobante no puede pesar más de 5 MB");