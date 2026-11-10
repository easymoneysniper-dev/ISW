// Rutas de clientes (Requisitos 1.9, 1.10 y 1.11). Se montan en /api/clientes (ver routes/index.js).
const { Router } = require("express");
const validate = require("../middlewares/validate.middleware");
const { requireAuth, requireRol } = require("../middlewares/auth.middleware");
const { crearClienteSchema, editarClienteSchema, idClienteSchema } = require("../schemas/cliente.schema");
const clienteController = require("../controllers/cliente.controller");

const router = Router();

// Todas exigen sesión y rol Dueño (Requisito 1.13).
router.use(requireAuth, requireRol("DUENO"));

router.get("/", clienteController.listar);
router.get("/:id", validate(idClienteSchema, "params"), clienteController.obtener);
router.post("/", validate(crearClienteSchema), clienteController.crear);
router.put("/:id", validate(idClienteSchema, "params"), validate(editarClienteSchema), clienteController.editar);
router.delete("/:id", validate(idClienteSchema, "params"), clienteController.eliminar);

module.exports = router;
