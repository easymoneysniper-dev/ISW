// Devolución del adelanto de una transmisión cancelada (requisito 4.8).
// Lo usa devolucion.controller.js. La devolución queda ligada al pago del adelanto (MER final)
// y reporte.service.js la descuenta de los ingresos del mes (requisito 4.7).
// Si una regla no se cumple, lanza un error de negocio y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const { noEncontrado, conflicto } = require("../utils/errores");

// Transmisión con sus pagos y la devolución de cada pago (si tiene). null si no existe.
function buscarTransmision(transmisionId) {
  return prisma.transmision.findUnique({
    where: { id: transmisionId },
    include: { pagos: { orderBy: { fecha: "asc" }, include: { devolucion: true } } },
  });
}

// Lo pagado, el id del pago del adelanto, la devolución (si ya existe) y si todavía se puede registrar.
function resumir(transmision) {
  const totalPagado = transmision.pagos.reduce((suma, pago) => suma + Number(pago.monto), 0);
  const adelanto = transmision.pagos.find((pago) => pago.tipo === "ADELANTO") ?? null;
  const devolucion = transmision.pagos.find((pago) => pago.devolucion)?.devolucion ?? null;
  // El Dueño decide al cancelar (requisito 1.7) si el adelanto se devuelve o se retiene.
  const marcadaParaDevolver =
    transmision.estado === "CANCELADA" && transmision.decisionAdelanto === "DEVOLVER";

  return {
    transmisionId: transmision.id,
    estadoTransmision: transmision.estado,
    decisionAdelanto: transmision.decisionAdelanto,
    totalPagado,
    pagoAdelantoId: adelanto?.id ?? null,
    marcadaParaDevolver,
    devolucion: devolucion && { ...devolucion, monto: Number(devolucion.monto) },
    puedeRegistrar: marcadaParaDevolver && Boolean(adelanto) && !devolucion,
  };
}

// La devolución de una transmisión (null si todavía no se registra). Lanza 404 si no existe.
async function obtenerPorTransmision(transmisionId) {
  const transmision = await buscarTransmision(transmisionId);

  if (!transmision) {
    throw noEncontrado("Transmisión no encontrada");
  }

  return resumir(transmision);
}

// Registra la devolución y la devuelve. Lanza un error si una regla lo impide.
async function registrar(datos, usuarioId = null) {
  const transmision = await buscarTransmision(datos.transmisionId);

  if (!transmision) {
    throw noEncontrado("La transmisión no existe");
  }

  const resumen = resumir(transmision);

  if (!resumen.marcadaParaDevolver) {
    throw conflicto(
      "Solo se registra la devolución de una transmisión cancelada con el adelanto marcado para devolver"
    );
  }

  if (!resumen.pagoAdelantoId) {
    throw conflicto("La transmisión no tiene un adelanto pagado");
  }

  if (resumen.devolucion) {
    throw conflicto("La devolución del adelanto ya está registrada");
  }

  if (datos.monto > resumen.totalPagado) {
    throw conflicto(`El monto supera lo pagado ($${resumen.totalPagado})`);
  }

  // La tabla devoluciones no tiene transmisionId: se liga al pago del adelanto.
  const { transmisionId, ...datosDevolucion } = datos;
  const devolucion = await prisma.devolucion.create({
    data: { ...datosDevolucion, pagoId: resumen.pagoAdelantoId },
  });

  // TEMPORAL: igual que en pago.service.js, hasta usar el registro de cambios del grupo (RF-48).
  await prisma.registroCambio.create({
    data: {
      usuarioId,
      modulo: "M4",
      accion: "CREAR",
      entidad: "Devolucion",
      entidadId: devolucion.id,
      detalle: `Devolución de $${devolucion.monto} del adelanto de la transmisión ${transmisionId}`,
    },
  });

  return { ...devolucion, monto: Number(devolucion.monto) };
}

module.exports = {
  obtenerPorTransmision,
  registrar,
};