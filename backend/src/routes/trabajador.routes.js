const { Router } = require("express");
const trabajadorController = require("../controllers/trabajador.controller");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} = require("../schemas/trabajador.schema");

const router = Router();

router.use(requireAuth);

router.get("/", trabajadorController.listar);
router.get("/:id", trabajadorController.obtener);
router.post("/", requireRol("DUENO"), validate(crearTrabajadorSchema), trabajadorController.crear);
router.put("/:id", requireRol("DUENO"), validate(actualizarTrabajadorSchema), trabajadorController.actualizar);

module.exports = router;