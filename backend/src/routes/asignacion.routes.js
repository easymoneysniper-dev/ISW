// Rutas de asignación de trabajadores, comisiones y reemplazos (/api/asignaciones).
const { Router } = require("express");
const asignacionController = require("../controllers/asignacion.controller");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  crearAsignacionSchema,
  definirComisionSchema,
  reemplazarAsignacionSchema,
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

router.post(
  "/:id/reemplazar",
  requireRol("DUENO"),
  validate(reemplazarAsignacionSchema),
  asignacionController.reemplazar
);

module.exports = router;