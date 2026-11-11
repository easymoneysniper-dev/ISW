// Enrutador central. app.js lo monta en /api.
// Cada recurso nuevo se registra aquí con su propio archivo de rutas.
const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const transmisionRoutes = require("./transmision.routes");
const clienteRoutes = require("./cliente.routes");
const trabajadorRoutes = require("./trabajador.routes");
const equipoRoutes = require("./equipo.routes");
const disponibilidadRoutes = require("./disponibilidad.routes");
const asignacionRoutes = require("./asignacion.routes");
const auditoriaRoutes = require("./auditoria.routes");
const pagoRoutes = require("./pago.routes");
const gastoRoutes = require("./gasto.routes");



const router = Router();

router.use("/", healthRoutes); // /api/health, /api/db-test
router.use("/", authRoutes); // /api/login, /api/sesion, /api/logout
router.use("/transmisiones", transmisionRoutes); // /api/transmisiones
router.use("/clientes", clienteRoutes); // /api/clientes (RF 1.9–1.11)
router.use("/trabajadores", trabajadorRoutes); // /api/trabajadores
router.use("/equipos", equipoRoutes); // RF 3.1
router.use("/disponibilidades", disponibilidadRoutes);
router.use("/asignaciones", asignacionRoutes);
router.use("/pagos", pagoRoutes); // /api/pagos
router.use("/gastos", gastoRoutes); // /api/gastos
router.use("/auditoria", auditoriaRoutes);


module.exports = router;
