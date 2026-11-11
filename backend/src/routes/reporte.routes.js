// Rutas de reportes del M4. Se montan en /api/reportes (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const reporteController = require("../controllers/reporte.controller");
const { periodoQuerySchema } = require("../schemas/costoFijo.schema");
const { transmisionIdParamSchema } = require("../schemas/pago.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada. Dueño y Contador consultan.
router.use(requireAuth, requireRol("DUENO", "CONTADOR"));

router.get(
  "/resumen-mensual",
  validate(periodoQuerySchema, "query"),
  reporteController.resumenMensual
);

router.get(
  "/transmision/:transmisionId/rentabilidad",
  validate(transmisionIdParamSchema, "params"),
  reporteController.rentabilidadTransmision
);

module.exports = router;