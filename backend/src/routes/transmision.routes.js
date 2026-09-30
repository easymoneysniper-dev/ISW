// Rutas de transmisiones. Se montan en /api/transmisiones (ver routes/index.js).
const { Router } = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const transmisionController = require("../controllers/transmision.controller");

const router = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
router.use(requireAuth);

router.get("/", transmisionController.listar);

module.exports = router;
