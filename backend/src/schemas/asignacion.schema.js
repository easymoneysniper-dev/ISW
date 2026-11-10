// Esquemas de validación Zod para asignación, comisiones, reemplazos, retiros y asistencia (RF-12 a RF-16).
const { z } = require("zod");
const { ROLES_VALIDOS } = require("./trabajador.schema");

const crearAsignacionSchema = z.object({
  transmisionId: z.coerce
    .number({ required_error: "Debe seleccionar una transmisión" })
    .int()
    .positive("ID de transmisión inválido"),
  trabajadorId: z.coerce
    .number({ required_error: "Debe seleccionar un trabajador" })
    .int()
    .positive("ID de trabajador inválido"),
  roles: z
    .array(
      z.enum(ROLES_VALIDOS, {
        errorMap: () => ({
          message:
            "Rol inválido. Debe ser: CAMARA, AUDIO, OPERADOR_SWITCH, INSTALACION_TECNICA o RELATOR",
        }),
      })
    )
    .min(1, "Debe indicar al menos un rol para el trabajador en la transmisión"),
  porcentajeComision: z.coerce
    .number()
    .gt(0, "El porcentaje debe ser mayor a 0")
    .max(100, "El porcentaje no puede superar el 100%")
    .optional()
    .nullable(),
  tiempoTrasladoConfigMin: z.coerce.number().int().min(0).optional(),
  aceptarAdvertencia: z.boolean().optional().default(false),
});

const definirComisionSchema = z.object({
  porcentajeComision: z.coerce
    .number({ required_error: "Debe ingresar el porcentaje de comisión" })
    .gt(0, "El porcentaje de comisión debe ser mayor a 0%")
    .max(100, "El porcentaje no puede superar el 100%"),
});

const reemplazarAsignacionSchema = z.object({
  nuevoTrabajadorId: z.coerce
    .number({ required_error: "Debe seleccionar al trabajador reemplazante" })
    .int()
    .positive("ID de trabajador reemplazante inválido"),
  motivo: z
    .string({ required_error: "El motivo del reemplazo es obligatorio" })
    .trim()
    .min(3, "Debe indicar un motivo válido para el reemplazo (mín. 3 caracteres)")
    .max(300, "El motivo no puede superar los 300 caracteres"),
  roles: z
    .array(z.enum(ROLES_VALIDOS))
    .min(1, "El reemplazante debe asumir al menos un rol")
    .optional(),
  porcentajeComision: z.coerce
    .number()
    .gt(0, "El porcentaje debe ser mayor a 0%")
    .max(100, "El porcentaje no puede superar el 100%")
    .optional()
    .nullable(),
  tiempoTrasladoConfigMin: z.coerce.number().int().min(0).optional(),
  aceptarAdvertencia: z.boolean().optional().default(false),
});

// RF-15: Retiro de una asignación sin reemplazo
const retirarAsignacionSchema = z.object({
  motivo: z
    .string({ required_error: "El motivo del retiro es obligatorio" })
    .trim()
    .min(3, "Debe indicar el motivo del retiro (mín. 3 caracteres)")
    .max(300, "El motivo no puede superar los 300 caracteres"),
});

// RF-16: Registro de asistencia del trabajador
const registrarAsistenciaSchema = z.object({
  asistencia: z.enum(["PENDIENTE", "ASISTIO", "NO_ASISTIO"], {
    errorMap: () => ({
      message: "La asistencia debe ser PENDIENTE, ASISTIO o NO_ASISTIO",
    }),
  }),
});

// RF-16: Registro de cámaras efectivamente utilizadas en la transmisión
const registrarCamarasSchema = z.object({
  camarasUtilizadas: z.coerce
    .number({ required_error: "Debe indicar la cantidad de cámaras utilizadas" })
    .int("La cantidad de cámaras debe ser un número entero")
    .min(0, "La cantidad de cámaras utilizadas no puede ser negativa")
    .nullable(),
});

module.exports = {
  crearAsignacionSchema,
  definirComisionSchema,
  reemplazarAsignacionSchema,
  retirarAsignacionSchema,
  registrarAsistenciaSchema,
  registrarCamarasSchema,
};