// Esquemas de validación con Zod para los acuerdos y aportes de auspiciadores.
// Lo usa routes/aporte.routes.js a través de validate.middleware.js.
const { z } = require("zod");

// Hoy a medianoche UTC, igual que se guardan las fechas sin hora.
function inicioDeHoy() {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
}

const valorPesos = z.coerce
  .number({ message: "El valor debe ser un número" })
  .int("El valor va en pesos, sin decimales")
  .positive("El valor en pesos debe ser mayor a 0");

// Un campo vacío del formulario cuenta como no enviado.
function opcional(esquema) {
  return z.preprocess((valor) => (valor === "" || valor === null ? undefined : valor), esquema.optional());
}

const aporteIdParamSchema = z.object({
  id: z.coerce.number().int().positive("El id del aporte debe ser un número positivo"),
});

// POST /api/aportes: acuerdo con un auspiciador. Si es dinero, el monto comprometido es obligatorio;
// si es canje, basta la descripción y el valor en pesos se ingresa al recibirlo.
const crearAcuerdoSchema = z
  .object({
    auspiciadorId: z.coerce
      .number({ message: "Debes elegir el auspiciador" })
      .int()
      .positive("Debes elegir el auspiciador"),
    transmisionId: z.coerce
      .number({ message: "Debes elegir la transmisión" })
      .int()
      .positive("Debes elegir la transmisión"),
    tipo: z.enum(["DINERO", "CANJE"], { message: "El tipo debe ser DINERO o CANJE" }),
    descripcion: z
      .string({ message: "La descripción es obligatoria" })
      .trim()
      .min(3, "Describe el acuerdo (al menos 3 caracteres)")
      .max(500, "La descripción no puede superar los 500 caracteres"),
    valorPesos: opcional(valorPesos),
    fechaComprometida: z.coerce
      .date({ message: "La fecha comprometida no es válida" })
      .refine((fecha) => fecha >= inicioDeHoy(), {
        message: "La fecha comprometida no puede ser anterior a hoy",
      }),
  })
  .refine((datos) => datos.tipo !== "DINERO" || datos.valorPesos !== undefined, {
    message: "Indica el monto comprometido en pesos",
    path: ["valorPesos"],
  });

// PATCH /api/aportes/:id/recepcion (formulario con el archivo "comprobante"). El valor solo se pide si es canje.
const recepcionSchema = z.object({
  fechaRecepcion: z.coerce
    .date({ message: "La fecha de recepción no es válida" })
    .refine((fecha) => fecha <= new Date(), { message: "La fecha de recepción no puede ser futura" }),
  valorPesos: opcional(valorPesos),
});

// PATCH /api/aportes/:id/no-cumplido
const noCumplidoSchema = z.object({
  observacion: z
    .string({ message: "La observación es obligatoria" })
    .trim()
    .min(5, "Explica en la observación por qué no se cumplió (al menos 5 caracteres)")
    .max(500, "La observación no puede superar los 500 caracteres"),
});

module.exports = {
  aporteIdParamSchema,
  crearAcuerdoSchema,
  recepcionSchema,
  noCumplidoSchema,
};