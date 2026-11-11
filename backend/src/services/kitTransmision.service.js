// M3 · Asignación de kits a transmisiones (RF 3.5). Lo usa kit.controller.js.
// Al asignar o retirar un kit se recalcula la cotización (cotizacion.service.js).
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const pagoService = require("./pago.service");
const { recargoPorCategoria, recalcular } = require("./cotizacion.service");
const { hayConflicto } = require("../utils/horario");
const { formatearTransmision } = require("../utils/formato");
const { noEncontrado, conflicto } = require("../utils/errores");

const ESTADOS_QUE_RESERVAN = ["COTIZADA", "ACEPTADA", "CONFIRMADA"];
const MARGEN_MS = 2 * 24 * 60 * 60 * 1000; // el traslado máximo es 24 h; se busca con holgura
const fechaHora = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short",
});

async function buscarTransmision(id) {
  const transmision = await prisma.transmision.findUnique({ where: { id } });
  if (!transmision) throw noEncontrado("Transmisión no encontrada");
  return transmision;
}

function exigirEstadoQueReserva(transmision) {
  if (!ESTADOS_QUE_RESERVAN.includes(transmision.estado)) {
    throw conflicto(`Solo se asignan o retiran kits de transmisiones Cotizadas, Aceptadas o Confirmadas (estado actual: ${transmision.estado})`);
  }
}

// Considera el tiempo de traslado (ver utils/horario.js).
async function choquesDelKit(kitId, transmision) {
  const cercanas = await prisma.transmision.findMany({
    where: {
      id: { not: transmision.id },
      estado: { in: ESTADOS_QUE_RESERVAN },
      kits: { some: { kitId } },
      inicio: { lt: new Date(transmision.termino.getTime() + MARGEN_MS) },
      termino: { gt: new Date(transmision.inicio.getTime() - MARGEN_MS) },
    },
    select: { id: true, nombreEvento: true, inicio: true, termino: true, tiempoTrasladoMin: true },
  });
  return cercanas.filter((otra) => hayConflicto(transmision, otra));
}

const describir = (choques) =>
  choques.map((t) => `${t.nombreEvento} (${fechaHora.format(t.inicio)})`).join(", ");

async function deTransmision(transmisionId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: transmisionId },
    include: { kits: { include: { kit: { select: { id: true, nombre: true, categoria: true } } } } },
  });
  if (!transmision) throw noEncontrado("Transmisión no encontrada");

  const asignadosIds = transmision.kits.map((uso) => uso.kitId);
  const candidatos = await prisma.kit.findMany({
    where: { enCondiciones: true, id: { notIn: asignadosIds } },
    select: { id: true, nombre: true, categoria: true },
    orderBy: { nombre: "asc" },
  });
  const disponibles = await Promise.all(candidatos.map(async (kit) => {
    const choques = await choquesDelKit(kit.id, transmision);
    return {
      ...kit,
      recargo: recargoPorCategoria(kit.categoria),
      choques: choques.map(({ id, nombreEvento, inicio }) => ({ id, nombreEvento, inicio })),
    };
  }));

  const { kits, ...datos } = transmision;
  return {
    transmision: formatearTransmision(datos),
    asignados: kits.map((uso) => ({ ...uso.kit, recargoAplicado: Number(uso.recargoAplicado) })),
    disponibles,
  };
}

async function asignar(transmisionId, { kitId, aceptarAdvertencia }, usuarioId) {
  const transmision = await buscarTransmision(transmisionId);
  exigirEstadoQueReserva(transmision);

  const kit = await prisma.kit.findUnique({ where: { id: kitId } });
  if (!kit) throw noEncontrado("Kit no encontrado");
  if (!kit.enCondiciones) {
    throw conflicto(`El kit ${kit.nombre} no está en condiciones de salir (lo indica el Jefe de Área Técnica)`);
  }
  const yaAsignado = await prisma.transmisionKit.findUnique({
    where: { transmisionId_kitId: { transmisionId, kitId } },
  });
  if (yaAsignado) throw conflicto(`El kit ${kit.nombre} ya está asignado a esta transmisión`);

  const advertencias = [];
  const choques = await choquesDelKit(kitId, transmision);
  if (choques.length) {
    const aviso = `El kit ${kit.nombre} ya está comprometido en: ${describir(choques)}`;
    if (!aceptarAdvertencia) throw conflicto(`${aviso}. Para asignarlo igual, acepta la advertencia`);
    advertencias.push(aviso);
  }

  const recargoAplicado = recargoPorCategoria(kit.categoria);
  const actualizada = await prisma.$transaction(async (tx) => {
    await tx.transmisionKit.create({ data: { transmisionId, kitId, recargoAplicado } });
    const resultado = await recalcular(tx, transmisionId);
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M3", accion: "ASIGNAR_KIT", entidad: "Transmision", entidadId: transmisionId,
      detalle: `Asignó el kit ${kit.nombre} (recargo ${recargoAplicado} %); precio cotizado $${resultado.precioCotizado}${choques.length ? "; aceptó la advertencia de horario" : ""}`,
    });
    return resultado;
  });

  if (transmision.estado === "CONFIRMADA" && actualizada.requiereAdelanto && !transmision.requiereAdelanto
      && !(await pagoService.adelantoRecibido(transmisionId))) {
    advertencias.push("La transmisión está Confirmada y ahora requiere un adelanto del 50 % que aún no se ha recibido");
  }
  return { transmision: formatearTransmision(actualizada), advertencias };
}

async function retirar(transmisionId, kitId, usuarioId) {
  const transmision = await buscarTransmision(transmisionId);
  exigirEstadoQueReserva(transmision);
  const uso = await prisma.transmisionKit.findUnique({
    where: { transmisionId_kitId: { transmisionId, kitId } },
    include: { kit: { select: { nombre: true } } },
  });
  if (!uso) throw noEncontrado("El kit no está asignado a esta transmisión");

  const actualizada = await prisma.$transaction(async (tx) => {
    await tx.transmisionKit.delete({ where: { transmisionId_kitId: { transmisionId, kitId } } });
    const resultado = await recalcular(tx, transmisionId);
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M3", accion: "RETIRAR_KIT", entidad: "Transmision", entidadId: transmisionId,
      detalle: `Retiró el kit ${uso.kit.nombre}; precio cotizado $${resultado.precioCotizado}`,
    });
    return resultado;
  });
  return { transmision: formatearTransmision(actualizada), advertencias: [] };
}

module.exports = { deTransmision, asignar, retirar, choquesDelKit };
