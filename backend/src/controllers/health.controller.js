// Endpoints para comprobar que el backend y la base de datos funcionan.
// Lo usa health.routes.js. Llama a health.service.js.
const healthService = require("../services/health.service");

// GET /api/health
function estadoBackend(req, res) {
  res.json({ status: "ok", message: "Backend funcionando correctamente" });
}

// GET /api/db-test
async function estadoBaseDatos(req, res) {
  try {
    const fechaServidorBD = await healthService.obtenerHoraBD();

    res.json({
      status: "ok",
      message: "PostgreSQL conectado correctamente",
      fechaServidorBD,
    });
  } catch (error) {
    console.error("Error PostgreSQL:", error);
    res.status(500).json({ status: "error", message: "No se pudo conectar con PostgreSQL" });
  }
}

module.exports = { estadoBackend, estadoBaseDatos };
