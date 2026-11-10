// Recibe las peticiones de transmisiones, llama a los services y responde.
// Lo usa routes/transmision.routes.js. Llama a transmision.service.js,
// transmisionEstado.service.js y disponibilidad.service.js.
const transmisionService = require("../services/transmision.service");
const estadoService = require("../services/transmisionEstado.service");
const disponibilidadService = require("../services/disponibilidad.service");

// Responde el error de una regla de negocio, o la transmisión con sus advertencias.
function responder(res, resultado, statusOk = 200) {
  if (resultado.error) {
    return res.status(resultado.status).json({ message: resultado.error });
  }
  res.status(statusOk).json({ ...resultado.transmision, advertencias: resultado.advertencias });
}

const usuarioId = (req) => req.session.usuario.id;

// GET /api/transmisiones?estado=CONFIRMADA
async function listar(req, res) {
  res.json(await transmisionService.listar(req.datosQuery));
}

// GET /api/transmisiones/calendario?mes=2026-12   (Requisito 1.8)
async function calendario(req, res) {
  res.json(await transmisionService.calendario(req.datosQuery.mes));
}

// GET /api/transmisiones/disponibilidad?inicio=...&termino=...&tiempoTrasladoMin=60   (Requisito 1.1)
async function disponibilidad(req, res) {
  res.json(await disponibilidadService.consultar(req.datosQuery));
}

// GET /api/transmisiones/:id   (ficha, Requisito 1.8)
async function obtener(req, res) {
  const transmision = await transmisionService.obtener(req.params.id);
  if (!transmision) return res.status(404).json({ message: "Transmisión no encontrada" });
  res.json(transmision);
}

// POST /api/transmisiones   (Requisitos 1.1 y 1.2)
async function crear(req, res) {
  responder(res, await transmisionService.crear(req.body, usuarioId(req)), 201);
}

// PUT /api/transmisiones/:id/requerimientos   (Requisito 1.12)
async function modificarRequerimientos(req, res) {
  responder(res, await transmisionService.modificarRequerimientos(req.params.id, req.body, usuarioId(req)));
}

// PATCH /api/transmisiones/:id/respuesta   body: { respuesta }   (Requisito 1.3)
async function registrarRespuesta(req, res) {
  responder(res, await estadoService.responder(req.params.id, req.body.respuesta, usuarioId(req)));
}

// PATCH /api/transmisiones/:id/confirmar   (Requisito 1.4)
async function confirmar(req, res) {
  responder(res, await estadoService.confirmar(req.params.id, usuarioId(req)));
}

// PATCH /api/transmisiones/:id/reprogramar   body: { inicio, termino }   (Requisito 1.6)
async function reprogramar(req, res) {
  responder(res, await estadoService.reprogramar(req.params.id, req.body, usuarioId(req)));
}

// PATCH /api/transmisiones/:id/cancelar   body: { motivo, decisionAdelanto? }   (Requisito 1.7)
async function cancelar(req, res) {
  responder(res, await estadoService.cancelar(req.params.id, req.body, usuarioId(req)));
}

module.exports = {
  listar,
  calendario,
  disponibilidad,
  obtener,
  crear,
  modificarRequerimientos,
  registrarRespuesta,
  confirmar,
  reprogramar,
  cancelar,
};
