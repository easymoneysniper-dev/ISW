// Controladores HTTP para asignación, comisiones, reemplazos, retiros y asistencia (RF-12 a RF-16).
const asignacionService = require("../services/asignacion.service");

async function obtenerPorTransmision(req, res, next) {
  try {
    const { transmisionId } = req.params;
    const { tiempoTrasladoMin } = req.query;
    const datos = await asignacionService.obtenerContextoTransmision(
      transmisionId,
      tiempoTrasladoMin
    );
    res.json(datos);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const nueva = await asignacionService.asignarTrabajador(
      req.body,
      req.session.usuario.id
    );
    res.status(201).json(nueva);
  } catch (error) {
    if (error.status === 409 && error.requiereConfirmacion) {
      return res.status(409).json({
        message: error.message,
        requiereConfirmacion: true,
        advertencias: error.advertencias,
      });
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function actualizarComision(req, res, next) {
  try {
    const actualizada = await asignacionService.definirPorcentajeComision(
      req.params.id,
      req.body.porcentajeComision,
      req.session.usuario.id
    );
    if (!actualizada) {
      return res.status(404).json({ message: "Asignación no encontrada" });
    }
    res.json(actualizada);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function reemplazar(req, res, next) {
  try {
    const nueva = await asignacionService.reemplazarTrabajador(
      req.params.id,
      req.body,
      req.session.usuario.id
    );
    res.status(201).json(nueva);
  } catch (error) {
    if (error.status === 409 && error.requiereConfirmacion) {
      return res.status(409).json({
        message: error.message,
        requiereConfirmacion: true,
        advertencias: error.advertencias,
      });
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function retirar(req, res, next) {
  try {
    const retirada = await asignacionService.retirarTrabajador(
      req.params.id,
      req.body.motivo,
      req.session.usuario.id
    );
    if (!retirada) {
      return res.status(404).json({ message: "Asignación no encontrada" });
    }
    res.json(retirada);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function actualizarAsistencia(req, res, next) {
  try {
    const actualizada = await asignacionService.registrarAsistencia(
      req.params.id,
      req.body.asistencia,
      req.session.usuario.id
    );
    if (!actualizada) {
      return res.status(404).json({ message: "Asignación no encontrada" });
    }
    res.json(actualizada);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

async function actualizarCamaras(req, res, next) {
  try {
    const actualizada = await asignacionService.actualizarCamarasUtilizadas(
      req.params.transmisionId,
      req.body.camarasUtilizadas,
      req.session.usuario.id
    );
    if (!actualizada) {
      return res.status(404).json({ message: "Transmisión no encontrada" });
    }
    res.json(actualizada);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  obtenerPorTransmision,
  crear,
  actualizarComision,
  reemplazar,
  retirar,
  actualizarAsistencia,
  actualizarCamaras,
};