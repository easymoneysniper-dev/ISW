// Única conexión a PostgreSQL de todo el backend (Prisma).
// La usan los services y scripts/crearUsuario.js. Nadie más crea un PrismaClient.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
