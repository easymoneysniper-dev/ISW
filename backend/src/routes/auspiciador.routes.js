// Rutas de auspiciadores. Se montan en /api/auspiciadores (ver routes/index.js).
const { Router } = require("express");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const auspiciadorController = require("../controllers/auspiciador.controller");
const { crearAuspiciadorSchema } = require("../schemas/auspiciador.schema");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

// El Contador solo consulta; el Dueño consulta y registra.
router.get("/", requireRol("DUENO", "CONTADOR"), auspiciadorController.listar);

router.post(
  "/",
  requireRol("DUENO"),
  validate(crearAuspiciadorSchema),
  auspiciadorController.registrar
);

module.exports = router;