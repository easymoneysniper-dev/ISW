// Esquemas de validación Zod para asignación de trabajadores y comisiones (RF-12 y RF-13).
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
    .max(100, "El porcentaje de comisión no puede superar el 100%"),
});

module.exports = {
  crearAsignacionSchema,
  definirComisionSchema,
};