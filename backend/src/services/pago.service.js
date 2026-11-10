// Reglas y consultas de los pagos del cliente (RF-20, RF-21).
// Lo usa pago.controller.js y, por contrato, M1 (adelantoRecibido y saldoPagado).
const prisma = require("../config/prisma");

const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const ESTADOS_SIN_PAGO = ["COTIZADA", "RECHAZADA", "CANCELADA"];

// El estado se calcula con el dinero recibido, no se guarda.
function calcularEstadoPago({ precio, totalPagado, adelantoMinimo, termino, ahora = new Date() }) {
  if (totalPagado >= precio) return "PAGADO";
  if (ahora - termino > UNA_SEMANA_MS) return "ATRASADO";
  if (totalPagado >= adelantoMinimo) return "ADELANTO_PAGADO";
  return "PENDIENTE";
}

// Devuelve los pagos de una transmisión con sus totales y estado. null si no existe.
async function resumenPorTransmision(transmisionId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: transmisionId },
    include: { pagos: { orderBy: { fecha: "asc" } } },
  });

  if (!transmision) return null;

  const precio = Number(transmision.precioCotizado);
  const totalPagado = transmision.pagos.reduce((suma, pago) => suma + Number(pago.monto), 0);
  const adelantoMinimo = Math.ceil(precio * 0.5);

  return {
    transmisionId,
    estadoTransmision: transmision.estado,
    precioCotizado: precio,
    totalPagado,
    saldoPendiente: Math.max(precio - totalPagado, 0),
    // Lo calcula M1 al cotizar (requisito 1.2) y queda guardado en la transmisión.
    requiereAdelanto: transmision.requiereAdelanto,
    adelantoMinimo,
    estadoPago: calcularEstadoPago({
      precio,
      totalPagado,
      adelantoMinimo,
      termino: transmision.termino,
    }),
    pagos: transmision.pagos.map((pago) => ({ ...pago, monto: Number(pago.monto) })),
  };
}

// Registra un pago. Devuelve { pago } si se guardó o { error, status } si una regla lo impide.
async function registrar(datos, usuarioId = null) {
  const resumen = await resumenPorTransmision(datos.transmisionId);

  if (!resumen) {
    return { error: "La transmisión no existe", status: 404 };
  }

  if (ESTADOS_SIN_PAGO.includes(resumen.estadoTransmision)) {
    return {
      error: `No se pueden registrar pagos de una transmisión ${resumen.estadoTransmision.toLowerCase()}`,
      status: 409,
    };
  }

  if (datos.monto > resumen.saldoPendiente) {
    return {
      error: `El monto supera el saldo pendiente ($${resumen.saldoPendiente})`,
      status: 409,
    };
  }

  if (datos.tipo === "ADELANTO" && resumen.totalPagado >= resumen.adelantoMinimo) {
    return { error: "El adelanto ya está cubierto; registra el pago como SALDO", status: 409 };
  }

  const pago = await prisma.pago.create({ data: datos });

  // TEMPORAL: cambiar por auditoriaService.registrar(...) cuando exista (RF-48).
  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M4",
      accion: "CREAR",
      entidad: "Pago",
      entidadId: pago.id,
      detalle: `Pago ${pago.tipo} de $${pago.monto} para la transmisión ${pago.transmisionId}`,
    },
  });

  return { pago: { ...pago, monto: Number(pago.monto) } };
}

// Contrato con M1 (RF-05): ¿se puede confirmar?
async function adelantoRecibido(transmisionId) {
  const resumen = await resumenPorTransmision(transmisionId);
  return Boolean(resumen) && resumen.totalPagado >= resumen.adelantoMinimo;
}

// Contrato con M1 (RF-50): ¿se puede cerrar?
async function saldoPagado(transmisionId) {
  const resumen = await resumenPorTransmision(transmisionId);
  return Boolean(resumen) && resumen.totalPagado >= resumen.precioCotizado;
}

module.exports = {
  resumenPorTransmision,
  registrar,
  adelantoRecibido,
  saldoPagado,
  calcularEstadoPago,
};
