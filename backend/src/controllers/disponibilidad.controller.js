// Controladores HTTP para disponibilidad de trabajadores (RF-11).
const disponibilidadService = require("../services/disponibilidad.service");

async function listar(req, res, next) {
  try {
    const { trabajadorId } = req.query;
    const bloques = await disponibilidadService.listarDisponibilidades({ trabajadorId });
    res.json(bloques);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const nuevo = await disponibilidadService.crearDisponibilidad(
      req.body,
      req.session.usuario.id
    );
    res.status(201).json(nuevo);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await disponibilidadService.actualizarDisponibilidad(
      req.params.id,
      req.body,
      req.session.usuario.id
    );
    if (!actualizado) {
      return res.status(404).json({ message: "Bloque de disponibilidad no encontrado" });
    }
    res.json(actualizado);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const eliminado = await disponibilidadService.eliminarDisponibilidad(
      req.params.id,
      req.session.usuario.id
    );
    if (!eliminado) {
      return res.status(404).json({ message: "Bloque de disponibilidad no encontrado" });
    }
    res.json({ message: "Bloque de disponibilidad eliminado correctamente" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
};