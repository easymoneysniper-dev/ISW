// Enrutador central. app.js lo monta en /api.
// Cada recurso nuevo se registra aquí con su propio archivo de rutas.
const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const transmisionRoutes = require("./transmision.routes");
const trabajadorRoutes = require("./trabajador.routes");
const equipoRoutes = require("./equipo.routes");

const router = Router();

router.use("/", healthRoutes); // /api/health, /api/db-test
router.use("/", authRoutes); // /api/login, /api/sesion, /api/logout
router.use("/transmisiones", transmisionRoutes); // /api/transmisiones
router.use("/trabajadores", trabajadorRoutes); // /api/trabajadores
router.use("/equipos", equipoRoutes); // RF 3.1

module.exports = router;
