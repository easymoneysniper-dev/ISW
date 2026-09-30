// Configuración de la sesión con cookie (express-session).
// La usa app.js para registrar la sesión y auth.controller.js para borrar la cookie al salir.
const session = require("express-session");

const NOMBRE_COOKIE = "isw.sid";

// Opciones de la cookie. Se reutilizan al borrarla en el logout.
const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leerla
  sameSite: "lax",
  secure: false, // true solo si el sitio se sirve con HTTPS
};

function crearSesion() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("Falta SESSION_SECRET en el archivo .env");
  }

  return session({
    name: NOMBRE_COOKIE,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...opcionesCookie,
      maxAge: 60 * 60 * 1000, // 1 hora
    },
  });
}

module.exports = { crearSesion, NOMBRE_COOKIE, opcionesCookie };
