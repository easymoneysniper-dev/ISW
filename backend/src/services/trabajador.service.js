// Lógica de negocio para el registro y gestión de trabajadores (RF-10).
const prisma = require("../config/prisma");
const { noEncontrado, conflicto } = require("../utils/errores");

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
  
  if (datos.activo === false && existente.activo) {
    const pendientes = await prisma.asignacion.count({
      where: {
        trabajadorId,
        estado: "ASIGNADO",
        transmision: {
          inicio: { gt: new Date() },
          estado: { in: ["COTIZADA", "ACEPTADA", "CONFIRMADA"] },
        },
      },
    });
    if (pendientes > 0) {
      throw conflicto(
        `No se puede desactivar: tiene ${pendientes} asignación(es) en transmisiones futuras. Reemplázalo o retíralo primero (Requisitos 2.2 y 2.9)`
      );
    }
  }

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

// Requisito 2.4: transmisiones y comisiones de un trabajador en un período.
// Solo aparecen aquellas en que fue asignado, reemplazado o tuvo asistencia confirmada.
async function historialTrabajador(id, { desde, hasta }) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id },
    select: { id: true, rut: true, nombre: true },
  });
  if (!trabajador) throw noEncontrado("Trabajador no encontrado");
 
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      trabajadorId: id,
      transmision: { inicio: { gte: desde, lt: hasta } },
      OR: [{ estado: { in: ["ASIGNADO", "REEMPLAZADO"] } }, { asistencia: "ASISTIO" }],
    },
    include: {
      transmision: { select: { id: true, nombreEvento: true, inicio: true, estado: true, precioCotizado: true } },
      roles: { select: { rolTecnico: { select: { nombre: true } } } },
    },
    orderBy: { transmision: { inicio: "desc" } },
  });
 
  const participaciones = asignaciones.map((a) => {
    const porcentaje = a.porcentajeComision === null ? null : Number(a.porcentajeComision);
    const devenga = a.estado === "ASIGNADO" && a.asistencia === "ASISTIO" && porcentaje !== null;
    const { precioCotizado, ...transmision } = a.transmision;
    return {
      asignacionId: a.id,
      transmision,
      roles: a.roles.map((r) => r.rolTecnico.nombre),
      estadoAsignacion: a.estado,
      asistencia: a.asistencia,
      porcentajeComision: porcentaje,
      montoComision: devenga ? Math.round((Number(precioCotizado) * porcentaje) / 100) : 0,
      liquidada: Boolean(a.fechaLiquidacion),
      fechaLiquidacion: a.fechaLiquidacion,
    };
  });
 
  const sumar = (lista) => lista.reduce((suma, p) => suma + p.montoComision, 0);
  return {
    trabajador,
    participaciones,
    totales: {
      comisionesPendientes: sumar(participaciones.filter((p) => !p.liquidada)),
      comisionesLiquidadas: sumar(participaciones.filter((p) => p.liquidada)),
    },
  };
}


module.exports = {
  listarTrabajadores,
  obtenerTrabajadorPorId,
  crearTrabajador,
  actualizarTrabajador,
  historialTrabajador,
};