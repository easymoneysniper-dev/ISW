// Recibe las peticiones de clientes, llama al service y responde.
// Lo usa routes/cliente.routes.js. Llama a services/cliente.service.js.
const clienteService = require("../services/cliente.service");

// Responde el error de una regla de negocio o el cliente con el código indicado.
function responder(res, resultado, statusOk = 200) {
  if (resultado.error) {
    return res.status(resultado.status).json({ message: resultado.error });
  }
  res.status(statusOk).json(resultado.cliente);
}

// GET /api/clientes?buscar=texto
async function listar(req, res) {
  const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
  res.json(await clienteService.listar(buscar));
}

// GET /api/clientes/:id
async function obtener(req, res) {
  const cliente = await clienteService.obtener(req.params.id);
  if (!cliente) return res.status(404).json({ message: "Cliente no encontrado" });
  res.json(cliente);
}

// POST /api/clientes   body: { nombre, telefono?, email? }
async function crear(req, res) {
  responder(res, await clienteService.crear(req.body, req.session.usuario.id), 201);
}

// PUT /api/clientes/:id   body: campos a cambiar
async function editar(req, res) {
  responder(res, await clienteService.editar(req.params.id, req.body, req.session.usuario.id));
}

// DELETE /api/clientes/:id
async function eliminar(req, res) {
  const resultado = await clienteService.eliminar(req.params.id, req.session.usuario.id);
  if (resultado.error) return responder(res, resultado);
  res.json({ message: `Cliente ${resultado.cliente.nombre} eliminado` });
}

module.exports = { listar, obtener, crear, editar, eliminar };
