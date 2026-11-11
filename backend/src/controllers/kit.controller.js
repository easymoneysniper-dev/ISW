// M3 · Kits y su asignación a transmisiones (RF 3.2 y 3.5).
// Lo usa kit.routes.js. Llama a kit.service.js y kitTransmision.service.js.
const kitService = require("../services/kit.service");
const kitTransmisionService = require("../services/kitTransmision.service");

const usuarioId = (req) => req.session.usuario.id;

async function listar(req, res) { res.json(await kitService.listar()); }

async function obtener(req, res) { res.json(await kitService.obtener(req.params.id)); }

async function crear(req, res) {
  const { kit, advertencias } = await kitService.guardar(req.body, usuarioId(req));
  res.status(201).json({ ...kit, advertencias });
}

async function editar(req, res) {
  const { kit, advertencias } = await kitService.guardar(req.body, usuarioId(req), req.params.id);
  res.json({ ...kit, advertencias });
}

async function deTransmision(req, res) {
  res.json(await kitTransmisionService.deTransmision(req.params.transmisionId));
}

async function asignar(req, res) {
  const { transmision, advertencias } = await kitTransmisionService.asignar(req.params.transmisionId, req.body, usuarioId(req));
  res.status(201).json({ ...transmision, advertencias });
}

async function retirar(req, res) {
  const { transmision, advertencias } = await kitTransmisionService.retirar(req.params.transmisionId, req.params.kitId, usuarioId(req));
  res.json({ ...transmision, advertencias });
}

module.exports = { listar, obtener, crear, editar, deTransmision, asignar, retirar };
