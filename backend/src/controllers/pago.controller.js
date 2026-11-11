// Recibe las peticiones de pagos, llama al service y responde.
// Lo usa routes/pago.routes.js y llama a services/pago.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
// Si el pago no se guarda, comprobante.middleware.js borra el archivo subido.
const pagoService = require("../services/pago.service");

// GET /api/pagos/transmision/:transmisionId
async function resumenPorTransmision(req, res) {
  const resumen = await pagoService.obtenerResumen(req.params.transmisionId);
  res.json(resumen);
}

// POST /api/pagos (formulario con los datos del pago y el archivo "comprobante")
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  const pago = await pagoService.registrar(datos, usuarioId);
  res.status(201).json(pago);
}

module.exports = {
  resumenPorTransmision,
  registrar,
};