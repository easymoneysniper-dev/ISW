// Rutas de asignación de trabajadores y comisiones (/api/asignaciones).
const { Router } = require("express");
const asignacionController = require("../controllers/asignacion.controller");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  crearAsignacionSchema,
  definirComisionSchema,
} = require("../schemas/asignacion.schema");

const router = Router();

router.use(requireAuth);

router.get(
  "/transmision/:transmisionId",
  requireRol("DUENO", "CONTADOR"),
  asignacionController.obtenerPorTransmision
);

router.post(
  "/",
  requireRol("DUENO"),
  validate(crearAsignacionSchema),
  asignacionController.crear
);

router.patch(
  "/:id/comision",
  requireRol("DUENO"),
  validate(definirComisionSchema),
  asignacionController.actualizarComision
);

module.exports = router;