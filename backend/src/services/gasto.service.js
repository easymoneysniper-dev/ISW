// Reglas y consultas de los gastos de una transmisión y su rendición (M4, requisito 4.2).
// Lo usa gasto.controller.js y, por contrato, M1 (rendicionCompleta, para pasar a Rendida).
// MER v3.1: la rendición es el campo fechaRendicion de Transmision (vacío = pendiente).
const prisma = require("../config/prisma");

// Transmisiones que nunca se realizaron: no tienen gastos.
const ESTADOS_SIN_GASTOS = ["COTIZADA", "RECHAZADA"];

// TEMPORAL: cambiar por auditoriaService.registrar(...) cuando exista (RF-48).
function registrarCambio(usuarioId, accion, entidad, entidadId, detalle) {
  return prisma.registroCambio.create({
    data: { usuarioId, modulo: "M4", accion, entidad, entidadId, detalle },
  });
}

// Gastos de una transmisión con su total y si la rendición está completa. null si no existe.
async function listarPorTransmision(transmisionId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: transmisionId },
    include: { gastos: { orderBy: { fecha: "asc" } } },
  });

  if (!transmision) return null;

  const gastos = transmision.gastos.map((gasto) => ({ ...gasto, monto: Number(gasto.monto) }));

  return {
    transmisionId,
    estadoTransmision: transmision.estado,
    rendicionCompleta: Boolean(transmision.fechaRendicion),
    fechaRendicion: transmision.fechaRendicion,
    totalGastos: gastos.reduce((suma, gasto) => suma + gasto.monto, 0),
    gastos,
  };
}

// Registra un gasto. Devuelve { gasto } si se guardó o { error, status } si una regla lo impide.
async function registrar(datos, usuarioId = null) {
  const transmision = await prisma.transmision.findUnique({ where: { id: datos.transmisionId } });

  if (!transmision) {
    return { error: "La transmisión no existe", status: 404 };
  }

  if (ESTADOS_SIN_GASTOS.includes(transmision.estado)) {
    return {
      error: `No se pueden registrar gastos de una transmisión ${transmision.estado.toLowerCase()}`,
      status: 409,
    };
  }

  if (transmision.fechaRendicion) {
    return { error: "La rendición ya está completa; no se aceptan nuevos gastos", status: 409 };
  }

  const gasto = await prisma.gasto.create({ data: datos });

  await registrarCambio(
    usuarioId,
    "CREAR",
    "Gasto",
    gasto.id,
    `Gasto ${gasto.categoria} de $${gasto.monto} para la transmisión ${gasto.transmisionId}`
  );

  return { gasto: { ...gasto, monto: Number(gasto.monto) } };
}

// Marca la rendición como completa guardando la fecha de hoy en la transmisión.
// Solo si está Realizada (requisito 4.2). El paso a Rendida lo hace M1.
async function completarRendicion(transmisionId, usuarioId = null) {
  const transmision = await prisma.transmision.findUnique({ where: { id: transmisionId } });

  if (!transmision) {
    return { error: "La transmisión no existe", status: 404 };
  }

  if (transmision.fechaRendicion) {
    return { error: "La rendición de esta transmisión ya está completa", status: 409 };
  }

  if (transmision.estado !== "REALIZADA") {
    return {
      error: "Solo se puede completar la rendición de una transmisión realizada",
      status: 409,
    };
  }

  // Solo se toca fechaRendicion; el resto de la transmisión es de M1.
  const actualizada = await prisma.transmision.update({
    where: { id: transmisionId },
    data: { fechaRendicion: new Date() },
  });

  await registrarCambio(
    usuarioId,
    "ACTUALIZAR",
    "Transmision",
    transmisionId,
    `Rendición de gastos completa de la transmisión ${transmisionId}`
  );

  return { transmisionId, fechaRendicion: actualizada.fechaRendicion };
}

// Contrato con M1: ¿la transmisión puede pasar a Rendida?
async function rendicionCompleta(transmisionId) {
  const transmision = await prisma.transmision.findUnique({ where: { id: transmisionId } });
  return Boolean(transmision?.fechaRendicion);
}

module.exports = {
  listarPorTransmision,
  registrar,
  completarRendicion,
  rendicionCompleta,
};
