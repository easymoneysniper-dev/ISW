// Rutas de trabajadores. Se montan en /api/trabajadores (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const trabajadorController = require("../controllers/trabajador.controller");
const {
  idParamSchema,
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} = require("../schemas/trabajador.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

router.get("/", trabajadorController.listar);

router.get(
  "/:id",
  validate(idParamSchema, "params"),
  trabajadorController.obtenerPorId
);

router.post(
  "/",
  requireRol("DUENO"),
  validate(crearTrabajadorSchema),
  trabajadorController.crear
);

router.put(
  "/:id",
  requireRol("DUENO"),
  validate(idParamSchema, "params"),
  validate(actualizarTrabajadorSchema),
  trabajadorController.actualizar
);

module.exports = router;
