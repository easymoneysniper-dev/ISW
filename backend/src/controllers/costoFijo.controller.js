// Recibe las peticiones de costos fijos, llama al service y responde.
// Lo usa routes/costoFijo.routes.js y llama a services/costoFijo.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
const costoFijoService = require("../services/costoFijo.service");

// GET /api/costos-fijos?anio=2026&mes=11
async function listarPorPeriodo(req, res) {
  const { anio, mes } = req.datosQuery;
  res.json(await costoFijoService.listarPorPeriodo(anio, mes));
}

// POST /api/costos-fijos
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const costo = await costoFijoService.registrar(req.body, usuarioId);
  res.status(201).json(costo);
}

// DELETE /api/costos-fijos/:id
async function eliminar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  await costoFijoService.eliminar(req.params.id, usuarioId);
  res.json({ message: "Costo fijo eliminado" });
}

module.exports = {
  listarPorPeriodo,
  registrar,
  eliminar,
};