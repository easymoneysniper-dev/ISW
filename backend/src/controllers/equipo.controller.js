const service = require("../services/equipo.service");

async function listar(req, res) { res.json(await service.listar()); }
async function listarKits(req, res) { res.json(await service.listarKits()); }
async function comprasMensuales(req, res) { res.json(await service.comprasMensuales(req.datosQuery.mes)); }

async function guardar(req, res) {
  try {
    const equipo = await service.guardar(req.body, req.session.usuario.id, req.params.id ?? null);
    res.status(req.params.id ? 200 : 201).json(equipo);
  } catch (error) {
    if (error.code === "P2002") {
      const esSerie = String(error.meta?.target).includes("numeroSerie");
      return res.status(409).json({ message: esSerie
        ? "Ya existe un equipo con ese número de serie. Revisa el inventario."
        : "Ya existe un kit con ese nombre. Selecciónalo en la lista de kits existentes." });
    }
    if (error.code === "P2003") {
      return res.status(400).json({ message: "El kit seleccionado no existe. Actualiza la lista." });
    }
    throw error;
  }
}

module.exports = { listar, listarKits, comprasMensuales, guardar };
