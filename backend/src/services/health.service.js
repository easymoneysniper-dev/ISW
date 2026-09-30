// Comprueba que la base de datos responde.
// Lo usan health.controller.js (GET /api/db-test) y server.js (al arrancar).
const prisma = require("../config/prisma");

// Pide la hora actual a PostgreSQL. Si la BD no responde, lanza un error.
async function obtenerHoraBD() {
  const filas = await prisma.$queryRaw`SELECT NOW() AS now`;
  return filas[0].now;
}

module.exports = { obtenerHoraBD };
