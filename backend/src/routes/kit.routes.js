// M3 · Rutas /api/kits (RF 3.2 y 3.5).
// Kits: los gestiona el Jefe de Área Técnica. Asignación a transmisiones: el Dueño.
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const s = require("../schemas/kit.schema");
const c = require("../controllers/kit.controller");

const router = Router();
const consultan = requireRol("JEFE_TECNICO", "DUENO");

router.use(requireAuth);

// Van antes de "/:id" para que "transmision" no se lea como un id.
router.get("/transmision/:transmisionId", consultan, validate(s.transmisionParamSchema, "params"), c.deTransmision);
router.post("/transmision/:transmisionId", requireRol("DUENO"), validate(s.transmisionParamSchema, "params"), validate(s.asignarKitSchema), c.asignar);
router.delete("/transmision/:transmisionId/:kitId", requireRol("DUENO"), validate(s.kitTransmisionParamSchema, "params"), c.retirar);

router.get("/", consultan, c.listar);
router.get("/:id", consultan, validate(s.idKitSchema, "params"), c.obtener);
router.post("/", requireRol("JEFE_TECNICO"), validate(s.guardarKitSchema), c.crear);
router.put("/:id", requireRol("JEFE_TECNICO"), validate(s.idKitSchema, "params"), validate(s.guardarKitSchema), c.editar);

module.exports = router;
