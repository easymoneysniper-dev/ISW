// Lógica de negocio para el registro y gestión de trabajadores (RF-10).
const prisma = require("../config/prisma");

const includeRoles = {
  roles: {
    include: {
      rolTecnico: true,
    },
  },
};

function formatearTrabajador(t) {
  if (!t) return null;
  return {
    ...t,
    roles: Array.isArray(t.roles)
      ? t.roles.map((r) => (typeof r === "string" ? r : r.rolTecnico?.nombre)).filter(Boolean)
      : [],
  };
}

function construirRelacionRoles(nombresRoles = []) {
  const unicos = [...new Set(nombresRoles)];
  return unicos.map((nombre) => ({
    rolTecnico: {
      connectOrCreate: {
        where: { nombre },
        create: { nombre },
      },
    },
  }));
}

async function listarTrabajadores({ soloActivos = false } = {}) {
  const lista = await prisma.trabajador.findMany({
    where: soloActivos ? { activo: true } : undefined,
    include: includeRoles,
    orderBy: { nombre: "asc" },
  });
  return lista.map(formatearTrabajador);
}

async function obtenerTrabajadorPorId(id) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: Number(id) },
    include: includeRoles,
  });
  return formatearTrabajador(trabajador);
}

async function crearTrabajador(datos, usuarioId) {
  const creado = await prisma.trabajador.create({
    data: {
      rut: datos.rut.trim(),
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      email: datos.email ? datos.email.trim() : null,
      activo: datos.activo ?? true,
      roles: {
        create: construirRelacionRoles(datos.roles),
      },
    },
    include: includeRoles,
  });

  const nuevo = formatearTrabajador(creado);

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "CREAR",
      entidad: "Trabajador",
      entidadId: nuevo.id,
      detalle: `Registró al trabajador ${nuevo.nombre} (${nuevo.rut}) con roles: ${nuevo.roles.join(", ")}`,
    },
  });

  return nuevo;
}

async function actualizarTrabajador(id, datos, usuarioId) {
  const trabajadorId = Number(id);
  const existente = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
  });
  if (!existente) return null;

  const actualizadoRaw = await prisma.trabajador.update({
    where: { id: trabajadorId },
    data: {
      ...(datos.rut !== undefined && { rut: datos.rut.trim() }),
      ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
      ...(datos.telefono !== undefined && { telefono: datos.telefono.trim() }),
      ...(datos.email !== undefined && { email: datos.email ? datos.email.trim() : null }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
      ...(datos.roles !== undefined && {
        roles: {
          deleteMany: {},
          create: construirRelacionRoles(datos.roles),
        },
      }),
    },
    include: includeRoles,
  });

  const actualizado = formatearTrabajador(actualizadoRaw);

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Trabajador",
      entidadId: actualizado.id,
      detalle: `Actualizó ficha del trabajador ${actualizado.nombre} (activo: ${actualizado.activo})`,
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