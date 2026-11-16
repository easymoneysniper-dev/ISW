// Esquema de validación con Zod para los auspiciadores (nombre y contacto).
// Lo usa routes/auspiciador.routes.js a través de validate.middleware.js.
const { z } = require("zod");

const crearAuspiciadorSchema = z.object({
  nombre: z
    .string({ message: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  contacto: z
    .string({ message: "El contacto es obligatorio" })
    .trim()
    .min(3, "Indica un contacto (teléfono o correo)")
    .max(150, "El contacto no puede superar los 150 caracteres"),
});

module.exports = { crearAuspiciadorSchema };