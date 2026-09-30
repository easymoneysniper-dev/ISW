// Rutas de sesión. Se montan en /api (ver routes/index.js).
// Orden en cada ruta: middlewares (validar / exigir sesión) -> controller.
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { loginSchema } = require("../schemas/auth.schema");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/login", validate(loginSchema, "body"), authController.login);
router.get("/sesion", requireAuth, authController.obtenerSesion);
router.post("/logout", authController.logout);

module.exports = router;
