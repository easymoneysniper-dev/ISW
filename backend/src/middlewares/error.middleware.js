// Manejo central de errores (Clase 3). Va al final de app.js.
// En Express 5, si un controller async lanza un error, llega aquí solo.

// Ruta que no existe dentro de /api -> 404 en JSON.
function rutaNoEncontrada(req, res) {
  res.status(404).json({ message: "Ruta no encontrada" });
}

// Traduce los errores conocidos a un código HTTP y un mensaje simple.
// eslint-disable-next-line no-unused-vars
function manejarErrores(error, req, res, next) {
  // JSON mal escrito en el body.
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "El cuerpo de la petición no es un JSON válido" });
  }

  // Errores de Prisma.
  if (error.code === "P2002") {
    const campo = error.meta?.target ?? "campo";
    return res.status(409).json({
      message: `Conflicto: ya existe un registro con el mismo valor para ${campo}`,
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ message: "El recurso solicitado no fue encontrado" });
  }

  if (error.code === "P2003") {
    return res.status(400).json({ message: "La relación indicada no es válida" });
  }

  // Cualquier otro error: se registra en la terminal y se responde 500.
  console.error(error);
  res.status(500).json({ message: "Error interno del servidor" });
}

module.exports = { rutaNoEncontrada, manejarErrores };
