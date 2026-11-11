// Rutas de costos fijos. Se montan en /api/costos-fijos (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const costoFijoController = require("../controllers/costoFijo.controller");
const {
  periodoQuerySchema,
  idParamSchema,
  crearCostoFijoSchema,
} = require("../schemas/costoFijo.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// El Dueño consulta; el Contador consulta, registra y elimina (RNF-04).
router.get(
  "/",
  requireRol("DUENO", "CONTADOR"),
  validate(periodoQuerySchema, "query"),
  costoFijoController.listarPorPeriodo
);

router.post(
  "/",
  requireRol("CONTADOR"),
  validate(crearCostoFijoSchema),
  costoFijoController.registrar
);

router.delete(
  "/:id",
  requireRol("CONTADOR"),
  validate(idParamSchema, "params"),
  costoFijoController.eliminar
);

module.exports = router;
