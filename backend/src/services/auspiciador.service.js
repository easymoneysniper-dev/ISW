// Reglas y consultas de los auspiciadores.
// Lo usa auspiciador.controller.js. Los aportes de cada uno están en aporte.service.js.
// Si una regla no se cumple, lanza un error de negocio y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const { conflicto } = require("../utils/errores");

// Todos los auspiciadores, por nombre (para elegirlos al registrar un acuerdo).
function listar() {
  return prisma.auspiciador.findMany({ orderBy: { nombre: "asc" } });
}

// Registra un auspiciador y lo devuelve. No se repite el nombre (sin importar mayúsculas).
async function registrar(datos, usuarioId = null) {
  const repetido = await prisma.auspiciador.findFirst({
    where: { nombre: { equals: datos.nombre, mode: "insensitive" } },
  });

  if (repetido) {
    throw conflicto(`Ya existe el auspiciador "${repetido.nombre}"`);
  }

  const auspiciador = await prisma.auspiciador.create({ data: datos });

  // Deja el cambio anotado en el registro de cambios.
  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M4",
      accion: "CREAR",
      entidad: "Auspiciador",
      entidadId: auspiciador.id,
      detalle: `Auspiciador "${auspiciador.nombre}"`,
    },
  });

  return auspiciador;
}

module.exports = {
  listar,
  registrar,
};