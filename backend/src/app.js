// Arma la aplicación Express: middlewares globales, rutas y manejo de errores.
// No abre el puerto (eso lo hace server.js), así se puede probar sin levantar el servidor.
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { crearSesion } = require("./config/session");
const routes = require("./routes");
const { rutaNoEncontrada, manejarErrores } = require("./middlewares/error.middleware");

const app = express();

// Permite que React (otro puerto en desarrollo) llame a la API enviando la cookie.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json()); // Lee el body en formato JSON
app.use(morgan("dev")); // Muestra cada petición en la terminal
app.use(crearSesion()); // Sesión con cookie

// Todas las rutas de la API cuelgan de /api.
app.use("/api", routes);
app.use("/api", rutaNoEncontrada);

// En el servidor (NODE_ENV=production) el backend también entrega el frontend compilado,
// así todo funciona por un solo puerto y el frontend usa VITE_API_URL=/api (Clase 5).
const carpetaFrontend = path.join(__dirname, "..", "..", "frontend", "dist");

if (process.env.NODE_ENV === "production" && fs.existsSync(carpetaFrontend)) {
  app.use(express.static(carpetaFrontend));

  // Cualquier otra ruta devuelve index.html para que React decida qué mostrar.
  app.get("/{*ruta}", (req, res) => {
    res.sendFile(path.join(carpetaFrontend, "index.html"));
  });
}

// Siempre al final: traduce los errores a respuestas JSON.
app.use(manejarErrores);

module.exports = app;
