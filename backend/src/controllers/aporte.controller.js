// Recibe las peticiones de acuerdos y aportes, llama al service y responde.
// Lo usa routes/aporte.routes.js y llama a services/aporte.service.js.
// Si el service lanza un error, Express 5 lo pasa a error.middleware.js, que responde.
// Si la recepción no se guarda, comprobante.middleware.js borra el archivo subido.
const aporteService = require("../services/aporte.service");

// GET /api/aportes
async function listar(req, res) {
  res.json(await aporteService.listar());
}

// POST /api/aportes (acuerdo con un auspiciador)
async function registrarAcuerdo(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const aporte = await aporteService.registrarAcuerdo(req.body, usuarioId);
  res.status(201).json(aporte);
}

// PATCH /api/aportes/:id/recepcion (formulario con la fecha, el valor si es canje y el archivo "comprobante")
async function registrarRecepcion(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  const datos = { ...req.body, comprobanteArchivo: req.file.filename };
  res.json(await aporteService.registrarRecepcion(req.params.id, datos, usuarioId));
}

// PATCH /api/aportes/:id/no-cumplido
async function marcarNoCumplido(req, res) {
  const usuarioId = req.session.usuario?.id ?? null;
  res.json(await aporteService.marcarNoCumplido(req.params.id, req.body.observacion, usuarioId));
}

module.exports = {
  listar,
  registrarAcuerdo,
  registrarRecepcion,
  marcarNoCumplido,
};