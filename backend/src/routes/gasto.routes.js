// Rutas de gastos y rendición. Se montan en /api/gastos (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { exigirComprobante } = require("../middlewares/comprobante.middleware");
const gastoController = require("../controllers/gasto.controller");
const { transmisionIdParamSchema, crearGastoSchema } = require("../schemas/gasto.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// El Dueño consulta; el Contador consulta, registra y completa la rendición (RNF-04).
router.get(
  "/transmision/:transmisionId",
  requireRol("DUENO", "CONTADOR"),
  validate(transmisionIdParamSchema, "params"),
  gastoController.listarPorTransmision
);

// Orden: rol -> comprobante (multer arma req.body) -> validación -> controller.
router.post(
  "/",
  requireRol("CONTADOR"),
  exigirComprobante,
  validate(crearGastoSchema),
  gastoController.registrar
);

router.post(
  "/transmision/:transmisionId/rendicion",
  requireRol("CONTADOR"),
  validate(transmisionIdParamSchema, "params"),
  gastoController.completarRendicion
);

module.exports = router;
