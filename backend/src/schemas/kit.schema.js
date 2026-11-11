// M3 · Validación de kits y de su asignación a transmisiones (RF 3.2 y 3.5). La usa kit.routes.js.
const { z } = require("zod");

const MAX_ID = 2147483647;
const id = (campo) => z.coerce.number({ error: `${campo} debe ser un número` }).int().positive().max(MAX_ID);

const guardarKitSchema = z
  .object({
    nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(150),
    categoria: z.enum(["NUEVO", "INTERMEDIO", "ANTIGUO"], { error: "La clasificación debe ser NUEVO, INTERMEDIO o ANTIGUO" }),
    enCondiciones: z.boolean({ error: "Indica si el kit está en condiciones de salir" }),
    equipoIds: z
      .array(z.number().int().positive().max(MAX_ID), { error: "Selecciona los equipos del kit" })
      .min(1, "El kit debe tener al menos un equipo")
      .max(50, "Un kit no puede tener más de 50 equipos")
      .refine((ids) => new Set(ids).size === ids.length, "Hay equipos repetidos"),
    // true = acepta que al kit le falten equipos básicos.
    aceptarAdvertencia: z.boolean().default(false),
  })
  .strict();

const asignarKitSchema = z
  .object({
    kitId: id("El kit"),
    // true = asigna aunque el kit esté comprometido en un horario cercano.
    aceptarAdvertencia: z.boolean().default(false),
  })
  .strict();

const idKitSchema = z.object({ id: id("El id del kit") });
const transmisionParamSchema = z.object({ transmisionId: id("El id de la transmisión") });
const kitTransmisionParamSchema = z.object({ transmisionId: id("El id de la transmisión"), kitId: id("El id del kit") });

module.exports = { guardarKitSchema, asignarKitSchema, idKitSchema, transmisionParamSchema, kitTransmisionParamSchema };
