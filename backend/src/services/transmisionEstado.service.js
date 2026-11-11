// Cambios de estado de las transmisiones (Requisitos 1.3, 1.4, 1.5, 1.6 y 1.7).
//   COTIZADA → ACEPTADA | RECHAZADA            (1.3 respuesta del cliente)
//   ACEPTADA → CONFIRMADA                      (1.4 confirmación)
//   ACEPTADA | CONFIRMADA → CANCELADA          (1.7 cancelación)
//   CONFIRMADA → REALIZADA → RENDIDA → CERRADA (1.5 automáticos)
// Lo usan controllers/transmision.controller.js y transmision.service.js.
// Si una regla no se cumple, lanza un error (utils/errores.js) y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const pagoService = require("./pago.service");
const { recalcular } = require("./cotizacion.service");
const { formatearTransmision } = require("../utils/formato");
const { noEncontrado, conflicto, datosInvalidos } = require("../utils/errores");

const ESTADOS_MODIFICABLES = ["ACEPTADA", "CONFIRMADA"];
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
const NOMBRE_ESTADO = {
  COTIZADA: "Cotizada", ACEPTADA: "Aceptada", CONFIRMADA: "Confirmada", REALIZADA: "Realizada",
  RENDIDA: "Rendida", CERRADA: "Cerrada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada",
};

// Antes de cada acción se ponen al día los estados automáticos (una Confirmada ya terminada es Realizada).
async function buscar(id) {
  await sincronizarEstados();
  const transmision = await prisma.transmision.findUnique({ where: { id } });
  if (!transmision) throw noEncontrado("Transmisión no encontrada");
  return transmision;
}

// Lanza 409 si la transmisión no está en uno de los estados permitidos para la acción.
function exigirEstado(transmision, permitidos) {
  if (!permitidos.includes(transmision.estado)) {
    throw conflicto(
      `Esta acción solo se permite en estado ${permitidos.map((e) => NOMBRE_ESTADO[e]).join(" o ")} (estado actual: ${NOMBRE_ESTADO[transmision.estado]})`
    );
  }
}

// Libera el personal y los kits reservados (Requisitos 1.3, 1.6 y 1.7).
async function liberarRecursos(tx, transmisionId) {
  // Primero se cortan los vínculos de reemplazo para poder borrar las asignaciones.
  await tx.asignacion.updateMany({ where: { transmisionId }, data: { reemplazaAId: null } });
  const personal = await tx.asignacion.deleteMany({ where: { transmisionId } });
  const kits = await tx.transmisionKit.deleteMany({ where: { transmisionId } });
  return { personal: personal.count, kits: kits.count };
}

// Cambia el estado y deja registro, en una sola transacción.
async function cambiarEstado(tx, transmision, datos, usuarioId, detalle) {
  const actualizada = await tx.transmision.update({ where: { id: transmision.id }, data: datos });
  await auditoria.registrar(tx, {
    usuarioId, modulo: "M1", accion: "CAMBIAR_ESTADO", entidad: "Transmision", entidadId: transmision.id,
    detalle: `${NOMBRE_ESTADO[transmision.estado]} → ${NOMBRE_ESTADO[actualizada.estado]}${detalle ? `: ${detalle}` : ""}`,
  });
  return actualizada;
}

// Requisito 1.3: el cliente acepta o rechaza la cotización.
async function responder(id, respuesta, usuarioId) {
  const transmision = await buscar(id);
  exigirEstado(transmision, ["COTIZADA"]);

  return prisma.$transaction(async (tx) => {
    const advertencias = [];
    if (respuesta === "RECHAZADA") {
      const liberados = await liberarRecursos(tx, id);
      if (liberados.kits > 0) advertencias.push(`Se liberaron ${liberados.kits} kit(s) reservados`);
    }
    const actualizada = await cambiarEstado(tx, transmision, { estado: respuesta }, usuarioId, "respuesta del cliente");
    return { transmision: formatearTransmision(actualizada), advertencias };
  });
}

// Requisito 1.4: confirma una transmisión Aceptada; si requiere adelanto, debe estar recibido.
async function confirmar(id, usuarioId) {
  const transmision = await buscar(id);
  exigirEstado(transmision, ["ACEPTADA"]);

  if (transmision.requiereAdelanto && !(await pagoService.adelantoRecibido(id))) {
    const pagos = await pagoService.resumenPorTransmision(id);
    throw conflicto(
      `Requiere un adelanto del 50 % ($${pagos.adelantoMinimo}) y el Contador ha registrado $${pagos.totalPagado}`
    );
  }

  return prisma.$transaction(async (tx) => {
    const actualizada = await cambiarEstado(tx, transmision, { estado: "CONFIRMADA" }, usuarioId);
    return { transmision: formatearTransmision(actualizada), advertencias: [] };
  });
}

// Requisito 1.6: cambia fecha y horario; libera personal y kits para asignarlos otra vez.
async function reprogramar(id, { inicio, termino }, usuarioId) {
  const transmision = await buscar(id);
  exigirEstado(transmision, ESTADOS_MODIFICABLES);

  return prisma.$transaction(async (tx) => {
    const liberados = await liberarRecursos(tx, id);
    await tx.transmision.update({ where: { id }, data: { inicio, termino } });
    const actualizada = await recalcular(tx, id); // la duración y los kits pueden cambiar el adelanto
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M1", accion: "REPROGRAMAR", entidad: "Transmision", entidadId: id,
      detalle: `Nuevo horario ${inicio.toISOString()} – ${termino.toISOString()}; liberó ${liberados.personal} asignación(es) y ${liberados.kits} kit(s)`,
    });

    const advertencias = [];
    if (liberados.personal || liberados.kits) {
      advertencias.push(
        `Se liberaron ${liberados.personal} asignación(es) y ${liberados.kits} kit(s): asígnalos otra vez para el nuevo horario`
      );
    }
    return { transmision: formatearTransmision(actualizada), advertencias };
  });
}

// Requisito 1.7: cancela con motivo; si hubo adelanto, exige decidir si se retiene o se devuelve.
async function cancelar(id, { motivo, decisionAdelanto }, usuarioId) {
  const transmision = await buscar(id);
  exigirEstado(transmision, ESTADOS_MODIFICABLES);

  const pagos = await pagoService.resumenPorTransmision(id);
  const huboAdelanto = pagos.totalPagado > 0;
  if (huboAdelanto && !decisionAdelanto) {
    throw datosInvalidos(
      `Hay $${pagos.totalPagado} pagados: indica si el adelanto se retiene o se devuelve (decisionAdelanto: RETENER o DEVOLVER)`
    );
  }

  const advertencias = [];
  if (transmision.inicio - new Date() < SIETE_DIAS_MS) {
    advertencias.push("Faltan menos de siete días para el evento: es posible retener el adelanto");
  }
  if (huboAdelanto && decisionAdelanto === "DEVOLVER") {
    advertencias.push("El Contador debe registrar la devolución del adelanto (Requisito 4.8)");
  }

  return prisma.$transaction(async (tx) => {
    await liberarRecursos(tx, id);
    const datos = {
      estado: "CANCELADA",
      motivoCancelacion: motivo,
      decisionAdelanto: huboAdelanto ? decisionAdelanto : null,
    };
    const actualizada = await cambiarEstado(tx, transmision, datos, usuarioId, motivo);
    return { transmision: formatearTransmision(actualizada), advertencias };
  });
}

// --- Requisito 1.5: estados automáticos -------------------------------------------------

// Realizada → Rendida: asistencia confirmada, equipos devueltos (con incidente si volvieron mal)
// y rendición de gastos completa.
function puedeRendirse(transmision) {
  const asistenciaConfirmada = transmision.asignaciones
    .filter((a) => a.estado === "ASIGNADO")
    .every((a) => a.asistencia !== "PENDIENTE");
  const equiposRegistrados = transmision.salidas.every(
    (s) => s.fechaRetorno && s.estadoRetorno && (s.estadoRetorno === "BUEN_ESTADO" || s.incidente)
  );
  return asistenciaConfirmada && equiposRegistrados && Boolean(transmision.fechaRendicion);
}

// Rendida → Cerrada: pago completo y comisiones de quienes asistieron liquidadas.
function puedeCerrarse(transmision) {
  const totalPagado = transmision.pagos.reduce((suma, pago) => suma + Number(pago.monto), 0);
  const comisionesLiquidadas = transmision.asignaciones
    .filter((a) => a.estado === "ASIGNADO" && a.asistencia === "ASISTIO")
    .every((a) => a.fechaLiquidacion);
  return totalPagado >= Number(transmision.precioCotizado) && comisionesLiquidadas;
}

// Revisa las transmisiones en curso y avanza las que cumplen la condición.
// Se ejecuta antes de listar, mostrar una ficha o el calendario.
async function sincronizarEstados(ahora = new Date()) {
  const avanzar = async (transmision, estado, detalle) =>
    prisma.$transaction((tx) => cambiarEstado(tx, transmision, { estado }, null, detalle));

  const terminadas = await prisma.transmision.findMany({
    where: { estado: "CONFIRMADA", termino: { lt: ahora } },
  });
  for (const t of terminadas) await avanzar(t, "REALIZADA", "automático, ya pasó la hora de término");

  const realizadas = await prisma.transmision.findMany({
    where: { estado: "REALIZADA", fechaRendicion: { not: null } },
    include: {
      asignaciones: { select: { estado: true, asistencia: true } },
      salidas: { select: { fechaRetorno: true, estadoRetorno: true, incidente: { select: { id: true } } } },
    },
  });
  for (const t of realizadas.filter(puedeRendirse)) await avanzar(t, "RENDIDA", "automático, cierre operativo completo");

  const rendidas = await prisma.transmision.findMany({
    where: { estado: "RENDIDA" },
    include: {
      asignaciones: { select: { estado: true, asistencia: true, fechaLiquidacion: true } },
      pagos: { select: { monto: true } },
    },
  });
  for (const t of rendidas.filter(puedeCerrarse)) await avanzar(t, "CERRADA", "automático, pagada y comisiones liquidadas");
}

module.exports = {
  responder,
  confirmar,
  reprogramar,
  cancelar,
  sincronizarEstados,
  puedeRendirse,
  puedeCerrarse,
  liberarRecursos,
};
