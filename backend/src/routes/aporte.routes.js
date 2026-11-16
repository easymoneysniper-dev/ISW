// Rutas de acuerdos y aportes de auspiciadores.
// Se montan en /api/aportes (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { exigirComprobante } = require("../middlewares/comprobante.middleware");
const aporteController = require("../controllers/aporte.controller");
const {
  aporteIdParamSchema,
  crearAcuerdoSchema,
  recepcionSchema,
  noCumplidoSchema,
} = require("../schemas/aporte.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// Dueño y Contador consultan los acuerdos.
router.get("/", requireRol("DUENO", "CONTADOR"), aporteController.listar);

// Solo el Dueño registra acuerdos.
router.post(
  "/",
  requireRol("DUENO"),
  validate(crearAcuerdoSchema),
  aporteController.registrarAcuerdo
);

// Solo el Contador registra la recepción. Orden: rol -> comprobante -> validación -> controller.
router.patch(
  "/:id/recepcion",
  requireRol("CONTADOR"),
  exigirComprobante,
  validate(aporteIdParamSchema, "params"),
  validate(recepcionSchema),
  aporteController.registrarRecepcion
);

// Solo el Dueño marca un aporte como No cumplido.
router.patch(
  "/:id/no-cumplido",
  requireRol("DUENO"),
  validate(aporteIdParamSchema, "params"),
  validate(noCumplidoSchema),
  aporteController.marcarNoCumplido
);

module.exports = router;