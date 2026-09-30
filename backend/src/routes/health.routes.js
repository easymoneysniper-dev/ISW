// Rutas de diagnóstico. Se montan en /api (ver routes/index.js).
const { Router } = require("express");
const healthController = require("../controllers/health.controller");

const router = Router();

router.get("/health", healthController.estadoBackend);
router.get("/db-test", healthController.estadoBaseDatos);

module.exports = router;
