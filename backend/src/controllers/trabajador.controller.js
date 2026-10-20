// Recibe las peticiones HTTP de trabajadores, llama al service y responde.
// Lo usa routes/trabajador.routes.js y llama a services/trabajador.service.js.
const trabajadorService = require("../services/trabajador.service");

async function listar(req, res) {
  const trabajadores = await trabajadorService.listar();
  res.json(trabajadores);
}

async function obtenerPorId(req, res) {
  const trabajador = await trabajadorService.obtenerPorId(req.params.id);

  if (!trabajador) {
    return res.status(404).json({ message: "Trabajador no encontrado" });
  }

  res.json(trabajador);
}

async function crear(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const nuevo = await trabajadorService.crear(req.body, usuarioId);
  res.status(201).json(nuevo);
}

async function actualizar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const actualizado = await trabajadorService.actualizar(req.params.id, req.body, usuarioId);
  res.json(actualizado);
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
};
