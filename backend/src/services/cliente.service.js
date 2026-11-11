// Reglas y consultas de clientes (Requisitos 1.9, 1.10 y 1.11).
// Lo usa controllers/cliente.controller.js. Habla con la BD a través de config/prisma.js.
// Si una regla no se cumple, lanza un error (utils/errores.js) y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { noEncontrado, datosInvalidos, conflicto } = require("../utils/errores");

const conTransmisiones = { _count: { select: { transmisiones: true } } };
const VERBOS = { CREAR: "Registró", EDITAR: "Modificó", ELIMINAR: "Eliminó" };

// Deja registro de quién hizo el cambio (Requisito 2.3).
function auditar(tx, usuarioId, accion, cliente) {
  return auditoria.registrar(tx, {
    usuarioId,
    modulo: "M1",
    accion,
    entidad: "Cliente",
    entidadId: cliente.id,
    detalle: `${VERBOS[accion]} al cliente ${cliente.nombre}`,
  });
}

// Lista los clientes por nombre, con cuántas transmisiones tiene cada uno.
// Si llega un texto de búsqueda, filtra por nombre, teléfono o correo.
function listar(buscar) {
  const where = buscar
    ? {
        OR: [
          { nombre: { contains: buscar, mode: "insensitive" } },
          { telefono: { contains: buscar } },
          { email: { contains: buscar, mode: "insensitive" } },
        ],
      }
    : {};

  return prisma.cliente.findMany({ where, include: conTransmisiones, orderBy: { nombre: "asc" } });
}

// Ficha del cliente con sus transmisiones (la más próxima primero).
async function obtener(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      transmisiones: {
        select: { id: true, nombreEvento: true, inicio: true, estado: true },
        orderBy: { inicio: "asc" },
      },
    },
  });
  if (!cliente) throw noEncontrado("Cliente no encontrado");
  return cliente;
}

// Requisito 1.9: el schema ya exigió nombre y al menos un contacto.
function crear(datos, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.create({ data: datos });
    await auditar(tx, usuarioId, "CREAR", cliente);
    return cliente;
  });
}

// Requisito 1.10: el cliente debe conservar su nombre y al menos un contacto.
async function editar(id, cambios, usuarioId) {
  const actual = await prisma.cliente.findUnique({ where: { id } });
  if (!actual) throw noEncontrado("Cliente no encontrado");

  const resultado = { ...actual, ...cambios };
  if (!resultado.telefono && !resultado.email) {
    throw datosInvalidos("El cliente debe conservar al menos un dato de contacto (teléfono o correo)");
  }

  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.update({ where: { id }, data: cambios });
    await auditar(tx, usuarioId, "EDITAR", cliente);
    return cliente;
  });
}

// Requisito 1.11: solo se elimina si no tiene transmisiones asociadas.
async function eliminar(id, usuarioId) {
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: conTransmisiones });
  if (!cliente) throw noEncontrado("Cliente no encontrado");

  if (cliente._count.transmisiones > 0) {
    throw conflicto(
      `No se puede eliminar: el cliente tiene ${cliente._count.transmisiones} transmisión(es) asociada(s)`
    );
  }

  return prisma.$transaction(async (tx) => {
    await auditar(tx, usuarioId, "ELIMINAR", cliente);
    await tx.cliente.delete({ where: { id } });
    return cliente;
  });
}

module.exports = { listar, obtener, crear, editar, eliminar };
