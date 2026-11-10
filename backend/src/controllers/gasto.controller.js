// Recibe las peticiones de gastos y rendición, llama al service y responde.
// Lo usa routes/gasto.routes.js y llama a services/gasto.service.js.
const gastoService = require("../services/gasto.service");

// GET /api/gastos/transmision/:transmisionId
async function listarPorTransmision(req, res) {
  const resultado = await gastoService.listarPorTransmision(req.params.transmisionId);

  if (!resultado) {
    return res.status(404).json({ message: "Transmisión no encontrada" });
  }

  res.json(resultado);
}

// POST /api/gastos (formulario con los datos del gasto y el archivo "comprobante")
// Si algo falla, comprobante.middleware.js borra el archivo.
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  const resultado = await gastoService.registrar(datos, usuarioId);

  if (resultado.error) {
    return res.status(resultado.status).json({ message: resultado.error });
  }

  res.status(201).json(resultado.gasto);
}

// POST /api/gastos/transmision/:transmisionId/rendicion
async function completarRendicion(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const resultado = await gastoService.completarRendicion(req.params.transmisionId, usuarioId);

  if (resultado.error) {
    return res.status(resultado.status).json({ message: resultado.error });
  }

  res.json(resultado);
}

module.exports = {
  listarPorTransmision,
  registrar,
  completarRendicion,
};
