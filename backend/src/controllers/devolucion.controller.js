// Recibe las peticiones de la devolución del adelanto, llama al service y responde.
// Lo usa routes/devolucion.routes.js y llama a services/devolucion.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
// Si la devolución no se guarda, comprobante.middleware.js borra el archivo subido.
const devolucionService = require("../services/devolucion.service");

// GET /api/devoluciones/transmision/:transmisionId
async function obtenerPorTransmision(req, res) {
  const resumen = await devolucionService.obtenerPorTransmision(req.params.transmisionId);
  res.json(resumen);
}

// POST /api/devoluciones (formulario con los datos de la devolución y el archivo "comprobante")
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  const devolucion = await devolucionService.registrar(datos, usuarioId);
  res.status(201).json(devolucion);
}

module.exports = {
  obtenerPorTransmision,
  registrar,
};