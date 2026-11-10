// Rutas de disponibilidad horaria de trabajadores (/api/disponibilidades).
const { Router } = require("express");
const disponibilidadController = require("../controllers/disponibilidad.controller");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  crearDisponibilidadSchema,
  actualizarDisponibilidadSchema,
} = require("../schemas/disponibilidad.schema");

const router = Router();

router.use(requireAuth);

router.get("/", disponibilidadController.listar);
router.post(
  "/",
  requireRol("DUENO"),
  validate(crearDisponibilidadSchema),
  disponibilidadController.crear
);
router.put(
  "/:id",
  requireRol("DUENO"),
  validate(actualizarDisponibilidadSchema),
  disponibilidadController.actualizar
);
router.delete("/:id", requireRol("DUENO"), disponibilidadController.eliminar);

module.exports = router;