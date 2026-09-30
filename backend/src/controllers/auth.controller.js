// Recibe las peticiones de sesión, llama al service y responde.
// Lo usa auth.routes.js. Llama a auth.service.js.
const authService = require("../services/auth.service");
const { NOMBRE_COOKIE, opcionesCookie } = require("../config/session");

// POST /api/login  body: { email, password } (ya validado por Zod)
async function login(req, res) {
  const { email, password } = req.body;

  const usuario = await authService.verificarCredenciales(email, password);

  if (!usuario) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }

  // Crea una sesión nueva (id nuevo) después de autenticar al usuario.
  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });

  req.session.usuario = usuario;

  // Guarda la sesión antes de responder a React.
  await new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });

  res.json({ message: "Inicio de sesión correcto", usuario });
}

// GET /api/sesion  (requireAuth ya comprobó que hay sesión)
function obtenerSesion(req, res) {
  res.json({ usuario: req.session.usuario });
}

// POST /api/logout
async function logout(req, res) {
  await new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });

  res.clearCookie(NOMBRE_COOKIE, { path: "/", ...opcionesCookie });
  res.json({ message: "Sesión cerrada correctamente" });
}

module.exports = { login, obtenerSesion, logout };
