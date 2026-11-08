// Controladores HTTP para trabajadores (RF-10).
const trabajadorService = require("../services/trabajador.service");

async function listar(req, res, next) {
  try {
    const soloActivos = req.query.activo === "true";
    const trabajadores = await trabajadorService.listarTrabajadores({ soloActivos });
    res.json(trabajadores);
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const trabajador = await trabajadorService.obtenerTrabajadorPorId(req.params.id);
    if (!trabajador) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }
    res.json(trabajador);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const nuevo = await trabajadorService.crearTrabajador(req.body, req.session.usuario.id);
    res.status(201).json(nuevo);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Ya existe un trabajador con ese RUT o correo" });
    }
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await trabajadorService.actualizarTrabajador(
      req.params.id,
      req.body,
      req.session.usuario.id
    );
    if (!actualizado) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }
    res.json(actualizado);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Ya existe un trabajador con ese RUT o correo" });
    }
    next(error);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
};