// Esquemas de validación Zod para bloques de disponibilidad horaria (RF-11).
const { z } = require("zod");

const bloqueBaseSchema = z.object({
  trabajadorId: z.coerce
    .number({ required_error: "Debe seleccionar un trabajador" })
    .int()
    .positive("El ID del trabajador no es válido"),
  inicio: z
    .string({ required_error: "La fecha y hora de inicio son obligatorias" })
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "La fecha y hora de inicio no tienen un formato válido",
    }),
  termino: z
    .string({ required_error: "La fecha y hora de término son obligatorias" })
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "La fecha y hora de término no tienen un formato válido",
    }),
});

const crearDisponibilidadSchema = bloqueBaseSchema.refine(
  (datos) => new Date(datos.termino) > new Date(datos.inicio),
  {
    message: "La hora de término debe ser posterior a la hora de inicio",
    path: ["termino"],
  }
);

const actualizarDisponibilidadSchema = z
  .object({
    inicio: bloqueBaseSchema.shape.inicio.optional(),
    termino: bloqueBaseSchema.shape.termino.optional(),
  })
  .refine(
    (datos) => {
      if (datos.inicio && datos.termino) {
        return new Date(datos.termino) > new Date(datos.inicio);
      }
      return true;
    },
    {
      message: "La hora de término debe ser posterior a la hora de inicio",
      path: ["termino"],
    }
  );

module.exports = {
  crearDisponibilidadSchema,
  actualizarDisponibilidadSchema,
};