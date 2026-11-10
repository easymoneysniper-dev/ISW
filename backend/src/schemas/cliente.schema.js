// Reglas de forma de los datos de un cliente (Zod). Las usa routes/cliente.routes.js.
// Requisitos 1.9 y 1.10: nombre obligatorio y al menos un dato de contacto.
const { z } = require("zod");

// Texto opcional: quita espacios y guarda null si quedó vacío.
// Si el campo no se envía, queda undefined (al editar, no se toca).
const textoOpcional = (max, mensaje) =>
  z.string().trim().max(max, mensaje).nullish()
    .transform((valor) => (valor === undefined ? undefined : valor || null));

const nombre = z
  .string({ error: "El nombre es obligatorio" })
  .trim()
  .min(1, "El nombre es obligatorio")
  .max(150, "El nombre no puede pasar de 150 caracteres");

// Solo dígitos, espacios, +, guiones y paréntesis (ej: +56 9 1234 5678).
const telefono = textoOpcional(30, "El teléfono no puede pasar de 30 caracteres").refine(
  (valor) => !valor || /^[+\d][\d\s()-]{5,29}$/.test(valor),
  "El teléfono no es válido"
);

const email = textoOpcional(254, "El correo no puede pasar de 254 caracteres")
  .transform((valor) => (typeof valor === "string" ? valor.toLowerCase() : valor))
  .refine((valor) => !valor || z.email().safeParse(valor).success, "El correo no es válido");

const tieneContacto = (datos) => Boolean(datos.telefono || datos.email);
const mensajeContacto = {
  message: "Ingresa al menos un dato de contacto (teléfono o correo)",
  path: ["telefono"],
};

// POST /api/clientes
const crearClienteSchema = z
  .object({ nombre, telefono, email })
  .strict()
  .refine(tieneContacto, mensajeContacto);

// PUT /api/clientes/:id — se envían solo los campos que cambian.
// Que el cliente conserve al menos un contacto se revisa en el service,
// porque depende de los datos que ya tiene guardados.
const editarClienteSchema = z
  .object({ nombre: nombre.optional(), telefono, email })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, "No enviaste datos para modificar");

const idClienteSchema = z.object({
  id: z.coerce.number({ error: "El id debe ser un número" }).int().positive().max(2147483647),
});

module.exports = { crearClienteSchema, editarClienteSchema, idClienteSchema };
