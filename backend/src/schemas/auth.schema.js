// Reglas de los datos que llegan al iniciar sesión (Zod).
// Las usa auth.routes.js junto con validate.middleware.js.
const { z } = require("zod");

const loginSchema = z.object({
  email: z
    .string({ error: "El correo es obligatorio" })
    .trim()
    .min(1, "El correo es obligatorio")
    .max(254, "El correo es demasiado largo")
    .toLowerCase(),
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(1, "La contraseña es obligatoria")
    // bcrypt solo usa los primeros 72 bytes de la contraseña.
    .refine((valor) => Buffer.byteLength(valor, "utf8") <= 72, "La contraseña es demasiado larga"),
});

module.exports = { loginSchema };
