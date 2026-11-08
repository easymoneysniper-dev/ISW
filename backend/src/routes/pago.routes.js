// Rutas de pagos del cliente. Se montan en /api/pagos (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { exigirComprobante } = require("../middlewares/comprobante.middleware");
const pagoController = require("../controllers/pago.controller");
const { transmisionIdParamSchema, crearPagoSchema } = require("../schemas/pago.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// El Dueño consulta; el Contador consulta y registra (RNF-04).
router.get(
  "/transmision/:transmisionId",
  requireRol("DUENO", "CONTADOR"),
  validate(transmisionIdParamSchema, "params"),
  pagoController.resumenPorTransmision
);

// Orden: rol -> comprobante (multer arma req.body) -> validación -> controller.
router.post(
  "/",
  requireRol("CONTADOR"),
  exigirComprobante,
  validate(crearPagoSchema),
  pagoController.registrar
);

module.exports = router;