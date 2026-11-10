// Esquemas de validación Zod para el registro y actualización de trabajadores (RF-10).
const { z } = require("zod");

const ROLES_VALIDOS = [
  "CAMARA",
  "AUDIO",
  "OPERADOR_SWITCH",
  "INSTALACION_TECNICA",
  "RELATOR",
];

const crearTrabajadorSchema = z.object({
  rut: z
    .string({ required_error: "El RUT es obligatorio" })
    .trim()
    .min(7, "El RUT debe tener al menos 7 caracteres")
    .max(12, "El RUT no puede superar los 12 caracteres (ej: 12345678-9)"),
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  telefono: z
    .string({ required_error: "El teléfono es obligatorio" })
    .trim()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(30, "El teléfono no puede superar los 30 caracteres"),
  email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .optional()
    .nullable()
    .or(z.literal("")),
  roles: z
    .array(
      z.enum(ROLES_VALIDOS, {
        errorMap: () => ({
          message:
            "Rol inválido. Debe ser: CAMARA, AUDIO, OPERADOR_SWITCH, INSTALACION_TECNICA o RELATOR",
        }),
      })
    )
    .min(1, "Debe seleccionar al menos un rol para el trabajador"),
  activo: z.boolean().optional().default(true),
});

const actualizarTrabajadorSchema = crearTrabajadorSchema.partial().refine(
  (datos) => !datos.roles || datos.roles.length >= 1,
  {
    message: "El trabajador debe mantener al menos un rol asignado",
    path: ["roles"],
  }
);

module.exports = {
  ROLES_VALIDOS,
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
};