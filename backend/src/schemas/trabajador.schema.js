// Esquemas de validación con Zod para trabajadores y sus roles (RF-10).
// Lo usa routes/trabajador.routes.js a través de validate.middleware.js.
const { z } = require("zod");

const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El id debe ser un número positivo"),
});

const crearTrabajadorSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(150),
  rut: z.string().trim().min(8, "El RUT no es válido").max(20),
  telefono: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().toLowerCase().email("El correo no es válido").max(254).optional().nullable(),
  roles: z
    .array(z.string().trim().min(2, "El rol no puede estar vacío"))
    .min(1, "Debe asignar al menos un rol técnico al trabajador"),
  activo: z.boolean().optional(),
});

const actualizarTrabajadorSchema = crearTrabajadorSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

module.exports = {
  idParamSchema,
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
};
