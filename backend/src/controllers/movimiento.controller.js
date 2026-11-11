// M3 · Salida, retorno e incidentes de equipos (RF 3.3 y 3.4).
// Lo usa movimiento.routes.js. Llama a movimiento.service.js.
const service = require("../services/movimiento.service");

const usuarioId = (req) => req.session.usuario.id;

async function deTransmision(req, res) {
  res.json(await service.deTransmision(req.params.transmisionId));
}

async function registrarSalidas(req, res) {
  res.status(201).json(await service.registrarSalidas(req.body, usuarioId(req)));
}

async function registrarRetorno(req, res) {
  res.json(await service.registrarRetorno(req.params.id, req.body.estadoRetorno, usuarioId(req)));
}

async function registrarIncidente(req, res) {
  res.status(201).json(await service.registrarIncidente(req.params.id, req.body, usuarioId(req)));
}

module.exports = { deTransmision, registrarSalidas, registrarRetorno, registrarIncidente };
