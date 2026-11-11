// Rutas de transmisiones (Requisitos 1.1 a 1.8 y 1.12). Se montan en /api/transmisiones (ver routes/index.js).
// Consultar: cualquier usuario con sesión. Registrar o modificar: solo el Dueño (Requisito 1.13).
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const s = require("../schemas/transmision.schema");
const c = require("../controllers/transmision.controller");

const router = Router();
const soloDueno = requireRol("DUENO");
const conId = validate(s.idTransmisionSchema, "params");

router.use(requireAuth);

// Consultas (las rutas fijas van antes de "/:id" para que no se confundan con un id).
router.get("/", validate(s.listarQuerySchema, "query"), c.listar);
router.get("/calendario", validate(s.calendarioQuerySchema, "query"), c.calendario);
router.get("/disponibilidad", soloDueno, validate(s.disponibilidadQuerySchema, "query"), c.disponibilidad);
router.get("/:id", conId, c.obtener);

// Registro y requerimientos.
router.post("/", soloDueno, validate(s.crearTransmisionSchema), c.crear);
router.put("/:id/requerimientos", soloDueno, conId, validate(s.requerimientosSchema), c.modificarRequerimientos);

// Cambios de estado.
router.patch("/:id/respuesta", soloDueno, conId, validate(s.respuestaSchema), c.registrarRespuesta);
router.patch("/:id/confirmar", soloDueno, conId, c.confirmar);
router.patch("/:id/reprogramar", soloDueno, conId, validate(s.reprogramarSchema), c.reprogramar);
router.patch("/:id/cancelar", soloDueno, conId, validate(s.cancelarSchema), c.cancelar);

module.exports = router;
