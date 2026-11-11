// Consulta del historial de cambios (Requisito 2.3). Lo usa routes/auditoria.routes.js.
const auditoriaService = require("../services/auditoria.service");
 
// GET /api/auditoria?desde=2026-11-01&hasta=2026-11-30&usuarioId=1&modulo=M2&pagina=1
async function listar(req, res) {
  res.json(await auditoriaService.listar(req.datosQuery));
}
 
module.exports = { listar };
