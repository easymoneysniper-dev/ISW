// Lógica de negocio para el registro y gestión de trabajadores (RF-10).
const prisma = require("../config/prisma");

async function listarTrabajadores({ soloActivos = false } = {}) {
  return prisma.trabajador.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

async function obtenerTrabajadorPorId(id) {
  return prisma.trabajador.findUnique({
    where: { id: Number(id) },
  });
}

async function crearTrabajador(datos, usuarioId) {
  const nuevo = await prisma.trabajador.create({
    data: {
      nombre: datos.nombre,
      telefono: datos.telefono,
      rut: datos.rut || null,
      email: datos.email || null,
      roles: datos.roles,
      activo: datos.activo ?? true,
    },
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M2_PERSONAL",
      accion: "CREAR",
      entidad: "Trabajador",
      entidadId: nuevo.id,
      descripcion: `Registró al trabajador ${nuevo.nombre} con roles: ${nuevo.roles.join(", ")}`,
    },
  });

  return nuevo;
}

async function actualizarTrabajador(id, datos, usuarioId) {
  const existente = await obtenerTrabajadorPorId(id);
  if (!existente) return null;

  const actualizado = await prisma.trabajador.update({
    where: { id: Number(id) },
    data: {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.telefono !== undefined && { telefono: datos.telefono }),
      ...(datos.rut !== undefined && { rut: datos.rut || null }),
      ...(datos.email !== undefined && { email: datos.email || null }),
      ...(datos.roles !== undefined && { roles: datos.roles }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
    },
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M2_PERSONAL",
      accion: "ACTUALIZAR",
      entidad: "Trabajador",
      entidadId: actualizado.id,
      descripcion: `Actualizó ficha del trabajador ${actualizado.nombre} (activo: ${actualizado.activo})`,
    },
  });

  return actualizado;
}

module.exports = {
  listarTrabajadores,
  obtenerTrabajadorPorId,
  crearTrabajador,
  actualizarTrabajador,
};