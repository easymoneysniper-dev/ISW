// Rutas de asignación, comisiones, reemplazos, retiros y asistencia (/api/asignaciones).
const { Router } = require("express");
const asignacionController = require("../controllers/asignacion.controller");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  crearAsignacionSchema,
  definirComisionSchema,
  reemplazarAsignacionSchema,
  retirarAsignacionSchema,
  registrarAsistenciaSchema,
  registrarCamarasSchema,
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

router.post(
  "/:id/retirar",
  requireRol("DUENO"),
  validate(retirarAsignacionSchema),
  asignacionController.retirar
);

router.patch(
  "/:id/asistencia",
  requireRol("DUENO"),
  validate(registrarAsistenciaSchema),
  asignacionController.actualizarAsistencia
);

router.patch(
  "/transmision/:transmisionId/camaras",
  requireRol("DUENO"),
  validate(registrarCamarasSchema),
  asignacionController.actualizarCamaras
);

module.exports = router;