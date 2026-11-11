// M3 · Equipos (RF 3.1 y 3.6). Recibe las peticiones, llama al service y responde.
// Lo usa equipo.routes.js. Llama a equipo.service.js.
const service = require("../services/equipo.service");

async function listar(req, res) { res.json(await service.listar()); }

async function listarKits(req, res) { res.json(await service.listarKits()); }

async function comprasMensuales(req, res) { res.json(await service.comprasMensuales(req.datosQuery.mes)); }

async function reporteMensual(req, res) { res.json(await service.reporteMensual(req.datosQuery.mes)); }

async function guardar(req, res) {
  const equipo = await service.guardar(req.body, req.session.usuario.id, req.params.id ?? null);
  res.status(req.params.id ? 200 : 201).json(equipo);
}

module.exports = { listar, listarKits, comprasMensuales, reporteMensual, guardar };
