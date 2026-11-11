// Recibe las peticiones de gastos y rendición, llama al service y responde.
// Lo usa routes/gasto.routes.js y llama a services/gasto.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
// Si el gasto no se guarda, comprobante.middleware.js borra el archivo subido.
const gastoService = require("../services/gasto.service");

// GET /api/gastos/transmision/:transmisionId
async function listarPorTransmision(req, res) {
  const resultado = await gastoService.listarPorTransmision(req.params.transmisionId);
  res.json(resultado);
}

// POST /api/gastos (formulario con los datos del gasto y el archivo "comprobante")
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  const gasto = await gastoService.registrar(datos, usuarioId);
  res.status(201).json(gasto);
}

// POST /api/gastos/transmision/:transmisionId/rendicion
async function completarRendicion(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const resultado = await gastoService.completarRendicion(req.params.transmisionId, usuarioId);
  res.json(resultado);
}

module.exports = {
  listarPorTransmision,
  registrar,
  completarRendicion,
};