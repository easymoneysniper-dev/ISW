// Reglas de los formularios de auspiciadores y aportes.
// Son las mismas del backend (auspiciador.schema.js y aporte.schema.js) para avisar antes de enviar.
import { z } from "zod";
import { comprobanteSchema, fechaDeHoy, fechaNoFutura } from "./comprobante.schema";

const valorPesos = z.coerce
  .number({ message: "El valor debe ser un número" })
  .int("El valor va en pesos, sin decimales")
  .positive("El valor en pesos debe ser mayor a 0");

// Un campo vacío del formulario cuenta como no enviado.
const valorOpcional = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  valorPesos.optional()
);

export const crearAuspiciadorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  contacto: z
    .string()
    .trim()
    .min(3, "Indica un contacto (teléfono o correo)")
    .max(150, "El contacto no puede superar los 150 caracteres"),
});

export const crearAcuerdoSchema = z
  .object({
    auspiciadorId: z.string().min(1, "Debes elegir el auspiciador"),
    transmisionId: z.string().min(1, "Debes elegir la transmisión"),
    tipo: z.enum(["DINERO", "CANJE"], { message: "Elige el tipo de aporte" }),
    descripcion: z
      .string()
      .trim()
      .min(3, "Describe el acuerdo (al menos 3 caracteres)")
      .max(500, "La descripción no puede superar los 500 caracteres"),
    valorPesos: valorOpcional,
    fechaComprometida: z
      .string()
      .min(1, "Indica la fecha comprometida")
      .refine((fecha) => fecha >= fechaDeHoy(), "La fecha comprometida no puede ser anterior a hoy"),
  })
  .refine((datos) => datos.tipo !== "DINERO" || datos.valorPesos !== undefined, {
    message: "Indica el monto comprometido en pesos",
    path: ["valorPesos"],
  });

// El valor en pesos solo se pide si el aporte es un canje.
export function recepcionSchema(tipo) {
  return z
    .object({
      fechaRecepcion: fechaNoFutura(
        "Indica la fecha en que se recibió",
        "La fecha de recepción no puede ser futura"
      ),
      valorPesos: valorOpcional,
      comprobante: comprobanteSchema,
    })
    .refine((datos) => tipo !== "CANJE" || datos.valorPesos !== undefined, {
      message: "Indica el valor en pesos del canje",
      path: ["valorPesos"],
    });
}

export const noCumplidoSchema = z.object({
  observacion: z
    .string()
    .trim()
    .min(5, "Explica en la observación por qué no se cumplió (al menos 5 caracteres)")
    .max(500, "La observación no puede superar los 500 caracteres"),
});