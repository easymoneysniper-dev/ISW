// Reglas y consultas de las transmisiones.
// Lo usa transmision.controller.js. Habla con la BD a través de config/prisma.js.
const prisma = require("../config/prisma");

// Lista todas las transmisiones con su cliente, de la más próxima a la más lejana.
function listar() {
  return prisma.transmision.findMany({
    include: { cliente: true },
    orderBy: { inicio: "asc" },
  });
}

module.exports = { listar };
