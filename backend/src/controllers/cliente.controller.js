// Recibe las peticiones de clientes, llama al service y responde.
// Lo usa routes/cliente.routes.js. Llama a services/cliente.service.js.
// Los errores de negocio los lanza el service y los responde error.middleware.js.
const clienteService = require("../services/cliente.service");

// GET /api/clientes?buscar=texto
async function listar(req, res) {
  const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
  res.json(await clienteService.listar(buscar));
}

// GET /api/clientes/:id
async function obtener(req, res) {
  res.json(await clienteService.obtener(req.params.id));
}

// POST /api/clientes   body: { nombre, telefono?, email? }
async function crear(req, res) {
  res.status(201).json(await clienteService.crear(req.body, req.session.usuario.id));
}

// PUT /api/clientes/:id   body: campos a cambiar
async function editar(req, res) {
  res.json(await clienteService.editar(req.params.id, req.body, req.session.usuario.id));
}

// DELETE /api/clientes/:id
async function eliminar(req, res) {
  const cliente = await clienteService.eliminar(req.params.id, req.session.usuario.id);
  res.json({ message: `Cliente ${cliente.nombre} eliminado` });
}

module.exports = { listar, obtener, crear, editar, eliminar };
