// Recibe las peticiones de reportes del M4, llama al service y responde.
// Lo usa routes/reporte.routes.js y llama a services/reporte.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
const reporteService = require("../services/reporte.service");

// GET /api/reportes/resumen-mensual?anio=2026&mes=11
async function resumenMensual(req, res) {
  const { anio, mes } = req.datosQuery;
  res.json(await reporteService.resumenMensual(anio, mes));
}

// GET /api/reportes/transmision/:transmisionId/rentabilidad
async function rentabilidadTransmision(req, res) {
  const resultado = await reporteService.rentabilidadTransmision(req.params.transmisionId);
  res.json(resultado);
}

module.exports = {
  resumenMensual,
  rentabilidadTransmision,
};