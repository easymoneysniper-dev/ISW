// M3 · Validación de salidas, retornos e incidentes (RF 3.3 y 3.4). La usa movimiento.routes.js.
const { z } = require("zod");

const MAX_ID = 2147483647;
const id = (campo) => z.coerce.number({ error: `${campo} debe ser un número` }).int().positive().max(MAX_ID);

const registrarSalidasSchema = z
  .object({
    transmisionId: id("La transmisión"),
    salidas: z
      .array(z.object({ equipoId: id("El equipo"), responsableId: id("El trabajador responsable") }).strict(), {
        error: "Indica los equipos que salen",
      })
      .min(1, "Selecciona al menos un equipo")
      .max(100)
      .refine((lista) => new Set(lista.map((s) => s.equipoId)).size === lista.length, "Hay equipos repetidos"),
  })
  .strict();

const registrarRetornoSchema = z
  .object({
    estadoRetorno: z.enum(["BUEN_ESTADO", "DANADO", "NO_DEVUELTO"], {
      error: "El retorno debe ser BUEN_ESTADO, DANADO o NO_DEVUELTO",
    }),
  })
  .strict();

const registrarIncidenteSchema = z
  .object({
    tipo: z.enum(["DANO", "PERDIDA", "ROBO"], { error: "El tipo de incidente debe ser DANO, PERDIDA o ROBO" }),
    observacion: z
      .string({ error: "La observación es obligatoria" })
      .trim()
      .min(1, "La observación es obligatoria")
      .max(500, "La observación no puede pasar de 500 caracteres"),
  })
  .strict();

const idSalidaSchema = z.object({ id: id("El id de la salida") });
const transmisionParamSchema = z.object({ transmisionId: id("El id de la transmisión") });

module.exports = {
  registrarSalidasSchema,
  registrarRetornoSchema,
  registrarIncidenteSchema,
  idSalidaSchema,
  transmisionParamSchema,
};
