const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const controller = require("../controllers/equipo.controller");
const { guardarEquipoSchema, idEquipoSchema, mesComprasSchema } = require("../schemas/equipo.schema");

const router = Router();
router.use(requireAuth, requireRol("JEFE_TECNICO", "DUENO"));
router.get("/", controller.listar);
router.get("/kits", controller.listarKits);
router.get("/compras-mensuales", validate(mesComprasSchema, "query"), controller.comprasMensuales);
router.post("/", requireRol("JEFE_TECNICO"), validate(guardarEquipoSchema), controller.guardar);
router.put("/:id", requireRol("JEFE_TECNICO"), validate(idEquipoSchema, "params"), validate(guardarEquipoSchema), controller.guardar);
// La baja es un estado de la ficha: no se elimina la compra ni el equipo.
module.exports = router;
