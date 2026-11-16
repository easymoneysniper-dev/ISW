// Recibe las peticiones de auspiciadores, llama al service y responde.
// Lo usa routes/auspiciador.routes.js y llama a services/auspiciador.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
const auspiciadorService = require("../services/auspiciador.service");

// GET /api/auspiciadores
async function listar(req, res) {
  res.json(await auspiciadorService.listar());
}

// POST /api/auspiciadores
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const auspiciador = await auspiciadorService.registrar(req.body, usuarioId);
  res.status(201).json(auspiciador);
}

module.exports = {
  listar,
  registrar,
};