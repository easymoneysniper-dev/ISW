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

// Requisito 2.4: GET /api/trabajadores/:id/historial?desde=2026-11-01&hasta=2026-11-30
const fechaDia = z
  .string({ required_error: "Indica la fecha como AAAA-MM-DD" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Indica la fecha como AAAA-MM-DD")
  .transform((valor) => new Date(`${valor}T00:00:00-03:00`));
 
const historialQuerySchema = z
  .object({
    desde: fechaDia,
    hasta: fechaDia.transform((dia) => new Date(dia.getTime() + 24 * 60 * 60 * 1000)), // incluye ese día
  })
  .refine((datos) => datos.hasta > datos.desde, {
    message: "La fecha final debe ser igual o posterior a la inicial",
    path: ["hasta"],
  });
 
const idTrabajadorSchema = z.object({
  id: z.coerce.number({ error: "El id debe ser un número" }).int().positive(),
});


module.exports = {
  ROLES_VALIDOS,
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
  historialQuerySchema,
  idTrabajadorSchema,
};