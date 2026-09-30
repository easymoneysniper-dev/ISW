// Punto de arranque del backend: carga el .env, comprueba la base de datos y abre el puerto.
// Lo ejecutan "npm run dev" y "npm start". La aplicación en sí se arma en src/app.js.
require("dotenv").config();

const app = require("./src/app");
const prisma = require("./src/config/prisma");

const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    // Si PostgreSQL no responde, es mejor enterarse al arrancar.
    await prisma.$connect();
    console.log("Conexión con PostgreSQL correcta");
  } catch (error) {
    console.error("No se pudo conectar con PostgreSQL. Revisa DATABASE_URL en el .env");
    console.error(error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
  });
}

iniciar();
