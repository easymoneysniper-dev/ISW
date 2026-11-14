// Rutas de la devolución del adelanto. Se montan en /api/devoluciones (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { exigirComprobante } = require("../middlewares/comprobante.middleware");
const devolucionController = require("../controllers/devolucion.controller");
const { transmisionIdParamSchema } = require("../schemas/pago.schema");
const { crearDevolucionSchema } = require("../schemas/devolucion.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// El Dueño solo consulta; el Contador consulta y registra.
router.get(
  "/transmision/:transmisionId",
  requireRol("DUENO", "CONTADOR"),
  validate(transmisionIdParamSchema, "params"),
  devolucionController.obtenerPorTransmision
);

// Orden: rol -> comprobante (multer arma req.body) -> validación -> controller.
router.post(
  "/",
  requireRol("CONTADOR"),
  exigirComprobante,
  validate(crearDevolucionSchema),
  devolucionController.registrar
);

module.exports = router;