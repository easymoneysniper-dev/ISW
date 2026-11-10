// Reglas de forma de los datos de transmisiones (Zod). Las usa routes/transmision.routes.js.
// Las reglas que dependen de la BD (estado actual, pagos, etc.) están en los services.
const { z } = require("zod");
const { crearClienteSchema } = require("./cliente.schema");

const MAX_ID = 2147483647;
const ESTADOS = ["COTIZADA", "ACEPTADA", "CONFIRMADA", "REALIZADA", "RENDIDA", "CERRADA", "RECHAZADA", "CANCELADA"];

const texto = (campo, max) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo} no puede pasar de ${max} caracteres`);

// Fecha y hora con zona horaria, ej: "2026-12-05T15:00:00-03:00".
const fechaHora = (campo) =>
  z
    .iso.datetime({ offset: true, error: `${campo}: usa fecha y hora ISO, ej: 2026-12-05T15:00:00-03:00` })
    .transform((valor) => new Date(valor));

const pesos = (campo) =>
  z.number({ error: `${campo} debe ser un número` }).int(`${campo} va en pesos, sin decimales`);

const cantidadCamaras = z
  .number({ error: "La cantidad de cámaras debe ser un número" })
  .int("La cantidad de cámaras debe ser un número entero")
  .min(1, "La cantidad de cámaras debe ser mayor que cero")
  .max(50, "La cantidad de cámaras no puede pasar de 50");

const tiempoTrasladoMin = z
  .number({ error: "El tiempo de traslado debe ser un número de minutos" })
  .int("El tiempo de traslado va en minutos enteros")
  .min(0, "El tiempo de traslado no puede ser negativo")
  .max(1440, "El tiempo de traslado no puede pasar de 1440 minutos (24 horas)");

const precioBase = pesos("El precio base")
  .positive("El precio base debe ser mayor que cero")
  .max(99999999999999, "El precio base es demasiado alto");

const ajuste = pesos("El ajuste").min(-99999999999999).max(99999999999999); // puede ser 0 o negativo

const terminoDespuesDeInicio = [
  (datos) => !datos.inicio || !datos.termino || datos.termino > datos.inicio,
  { message: "La hora de término debe ser posterior a la de inicio", path: ["termino"] },
];

// POST /api/transmisiones (Requisito 1.1): cliente registrado (clienteId) o nuevo (cliente).
const crearTransmisionSchema = z
  .object({
    clienteId: z.number().int().positive().max(MAX_ID).optional(),
    cliente: crearClienteSchema.optional(),
    nombreEvento: texto("El nombre del evento", 200),
    inicio: fechaHora("Inicio"),
    termino: fechaHora("Término"),
    lugar: texto("El lugar", 250),
    zona: z.enum(["LOCAL", "REGIONES"], { error: "La zona debe ser LOCAL o REGIONES" }),
    cantidadCamaras,
    tiempoTrasladoMin,
    precioBase,
    ajuste,
  })
  .strict()
  .refine(...terminoDespuesDeInicio)
  .refine((datos) => Boolean(datos.clienteId) !== Boolean(datos.cliente), {
    message: "Indica un cliente registrado (clienteId) o uno nuevo (cliente), no ambos",
    path: ["clienteId"],
  });

// PUT /api/transmisiones/:id/requerimientos (Requisito 1.12).
const requerimientosSchema = z
  .object({
    cantidadCamaras: cantidadCamaras.optional(),
    tiempoTrasladoMin: tiempoTrasladoMin.optional(),
    precioBase: precioBase.optional(),
    ajuste: ajuste.optional(),
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, "No enviaste requerimientos para modificar");

// PATCH /api/transmisiones/:id/respuesta (Requisito 1.3).
const respuestaSchema = z
  .object({
    respuesta: z.enum(["ACEPTADA", "RECHAZADA"], { error: "La respuesta debe ser ACEPTADA o RECHAZADA" }),
  })
  .strict();

// PATCH /api/transmisiones/:id/reprogramar (Requisito 1.6).
const reprogramarSchema = z
  .object({ inicio: fechaHora("Inicio"), termino: fechaHora("Término") })
  .strict()
  .refine(...terminoDespuesDeInicio);

// PATCH /api/transmisiones/:id/cancelar (Requisito 1.7).
const cancelarSchema = z
  .object({
    motivo: texto("El motivo", 500),
    decisionAdelanto: z
      .enum(["RETENER", "DEVOLVER"], { error: "La decisión sobre el adelanto debe ser RETENER o DEVOLVER" })
      .optional(),
  })
  .strict();

const idTransmisionSchema = z.object({
  id: z.coerce.number({ error: "El id debe ser un número" }).int().positive().max(MAX_ID),
});

// GET /api/transmisiones?estado=CONFIRMADA
const listarQuerySchema = z.object({
  estado: z.enum(ESTADOS, { error: "Estado no válido" }).optional(),
});

// GET /api/transmisiones/calendario?mes=2026-12 (Requisito 1.8).
const calendarioQuerySchema = z.object({
  mes: z.string({ error: "Indica el mes como AAAA-MM" }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Indica el mes como AAAA-MM"),
});

// GET /api/transmisiones/disponibilidad?inicio=...&termino=...&tiempoTrasladoMin=60 (Requisito 1.1).
const disponibilidadQuerySchema = z
  .object({
    inicio: fechaHora("Inicio"),
    termino: fechaHora("Término"),
    tiempoTrasladoMin: z.coerce.number().int().min(0).max(1440).default(0),
    excluirId: z.coerce.number().int().positive().max(MAX_ID).optional(),
  })
  .refine(...terminoDespuesDeInicio);

module.exports = {
  crearTransmisionSchema,
  requerimientosSchema,
  respuestaSchema,
  reprogramarSchema,
  cancelarSchema,
  idTransmisionSchema,
  listarQuerySchema,
  calendarioQuerySchema,
  disponibilidadQuerySchema,
};
