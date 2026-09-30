// Recibe las peticiones de transmisiones, llama al service y responde.
// Lo usa transmision.routes.js. Llama a transmision.service.js.
const transmisionService = require("../services/transmision.service");

// GET /api/transmisiones
async function listar(req, res) {
  const transmisiones = await transmisionService.listar();
  res.json(transmisiones);
}

module.exports = { listar };
