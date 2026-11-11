// Filtros de la consulta del historial de cambios (Requisito 2.3). Los usa routes/auditoria.routes.js.
const { z } = require("zod");
 
// "AAAA-MM-DD" -> fecha a las 00:00 de Chile. "hasta" incluye ese día completo.
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD")
  .transform((valor) => new Date(`${valor}T00:00:00-03:00`));
 
const auditoriaQuerySchema = z.object({
  desde: fecha.optional(),
  hasta: fecha.transform((dia) => new Date(dia.getTime() + 24 * 60 * 60 * 1000)).optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  modulo: z.string().trim().min(1).max(20).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
});
 
module.exports = { auditoriaQuerySchema };