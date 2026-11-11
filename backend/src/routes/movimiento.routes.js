// M3 · Rutas /api/movimientos (RF 3.3 y 3.4). Registra el Jefe de Área Técnica; el Dueño consulta.
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const s = require("../schemas/movimiento.schema");
const c = require("../controllers/movimiento.controller");

const router = Router();
const registra = requireRol("JEFE_TECNICO");
const conId = validate(s.idSalidaSchema, "params");

router.use(requireAuth);

router.get("/transmision/:transmisionId", requireRol("JEFE_TECNICO", "DUENO"), validate(s.transmisionParamSchema, "params"), c.deTransmision);
router.post("/salidas", registra, validate(s.registrarSalidasSchema), c.registrarSalidas);
router.patch("/salidas/:id/retorno", registra, conId, validate(s.registrarRetornoSchema), c.registrarRetorno);
router.post("/salidas/:id/incidente", registra, conId, validate(s.registrarIncidenteSchema), c.registrarIncidente);

module.exports = router;
