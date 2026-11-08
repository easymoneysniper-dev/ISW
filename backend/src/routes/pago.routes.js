// Recibe las peticiones de pagos, llama al service y responde.
// Lo usa routes/pago.routes.js y llama a services/pago.service.js.
const fs = require("fs");
const pagoService = require("../services/pago.service");

// GET /api/pagos/transmision/:transmisionId
async function resumenPorTransmision(req, res) {
  const resumen = await pagoService.resumenPorTransmision(req.params.transmisionId);

  if (!resumen) {
    return res.status(404).json({ message: "Transmisión no encontrada" });
  }

  res.json(resumen);
}

// POST /api/pagos (formulario con los datos del pago y el archivo "comprobante")
async function registrar(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  const resultado = await pagoService.registrar(datos, usuarioId);

  if (resultado.error) {
    // El pago no se guardó: se borra el comprobante para no dejar archivos sueltos.
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(resultado.status).json({ message: resultado.error });
  }

  res.status(201).json(resultado.pago);
}

module.exports = {
  resumenPorTransmision,
  registrar,
};