// Reglas y consultas de los trabajadores y sus roles (RF-10).
// Lo usa trabajador.controller.js. Habla con la BD a través de config/prisma.js.
const prisma = require("../config/prisma");

// Lista todos los trabajadores ordenados por nombre.
function listar() {
  return prisma.trabajador.findMany({
    orderBy: { nombre: "asc" },
  });
}

// Busca un trabajador por su id. Devuelve null si no existe.
function obtenerPorId(id) {
  return prisma.trabajador.findUnique({
    where: { id },
  });
}

// Crea un trabajador nuevo con sus roles y registra el cambio en auditoría (RF-48).
async function crear(datos, usuarioId = null) {
  const trabajador = await prisma.trabajador.create({
    data: datos,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M2",
      accion: "CREAR",
      entidad: "Trabajador",
      entidadId: trabajador.id,
      detalle: `Se registró al trabajador ${trabajador.nombre} con roles: ${trabajador.roles.join(", ")}`,
    },
  });

  return trabajador;
}

// Actualiza datos o roles de un trabajador y registra el cambio (RF-48).
async function actualizar(id, datos, usuarioId = null) {
  const trabajador = await prisma.trabajador.update({
    where: { id },
    data: datos,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M2",
      accion: "EDITAR",
      entidad: "Trabajador",
      entidadId: trabajador.id,
      detalle: `Se actualizó al trabajador ${trabajador.nombre}`,
    },
  });

  return trabajador;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
};
