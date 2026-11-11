// Rutas del historial de cambios (Requisito 2.3). Se montan en /api/auditoria (ver routes/index.js).
// Solo el Dueño consulta. No hay rutas para modificar ni eliminar: el historial no se toca.
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { auditoriaQuerySchema } = require("../schemas/auditoria.schema");
const auditoriaController = require("../controllers/auditoria.controller");
 
const router = Router();
 
router.use(requireAuth, requireRol("DUENO"));
router.get("/", validate(auditoriaQuerySchema, "query"), auditoriaController.listar);
 
module.exports = router;
