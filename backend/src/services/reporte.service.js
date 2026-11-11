// Cálculos del M4: resumen mensual (requisito 4.7) y rentabilidad por transmisión (4.6).
// Lo usa reporte.controller.js. No guarda nada: todo se calcula con los registros (MER final).
// Si una regla no se cumple, lanza un error de negocio y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const { noEncontrado, conflicto } = require("../utils/errores");
const pagoService = require("./pago.service");
const costoFijoService = require("./costoFijo.service");

// ---------------------------------------------------------------------------
// TEMPORALES: devuelven 0 hasta que M2 y M3 tengan sus funciones.
// Cuando existan, se cambia solo el cuerpo de cada una (acordarlo en la reunión).
// ---------------------------------------------------------------------------

// M2 (requisito 2.2): comisiones liquidadas en el período.
async function comisionesLiquidadasTemporal({ transmisionId, inicio, fin } = {}) {
  return 0;
}

// M3 (requisitos 3.4 y 3.6): pérdidas de equipos en el período o de una transmisión.
async function perdidasEquiposTemporal({ transmisionId, inicio, fin } = {}) {
  return 0;
}

// M3 (requisito 3.6): compras de equipos en el período.
async function comprasEquiposTemporal({ inicio, fin } = {}) {
  return 0;
}

// Suma de un campo de Prisma (Decimal o null) como número.
function numero(valor) {
  return Number(valor ?? 0);
}

// Del 1 del mes a las 00:00 hasta el 1 del mes siguiente (las fechas se guardan en UTC).
function rangoDelMes(anio, mes) {
  return {
    inicio: new Date(Date.UTC(anio, mes - 1, 1)),
    fin: new Date(Date.UTC(anio, mes, 1)),
  };
}

// Transmisiones del mes que todavía tienen saldo pendiente (para que el Contador las revise).
async function pagosPendientesDelMes(inicio, fin) {
  const transmisiones = await prisma.transmision.findMany({
    where: {
      termino: { gte: inicio, lt: fin },
      estado: { notIn: ["COTIZADA", "RECHAZADA", "CANCELADA"] },
    },
    orderBy: { termino: "asc" },
  });

  const pendientes = [];

  for (const transmision of transmisiones) {
    const resumen = await pagoService.resumenPorTransmision(transmision.id);

    if (resumen.saldoPendiente > 0) {
      pendientes.push({
        transmisionId: transmision.id,
        nombreEvento: transmision.nombreEvento,
        termino: transmision.termino,
        saldoPendiente: resumen.saldoPendiente,
        estadoPago: resumen.estadoPago,
      });
    }
  }

  return pendientes;
}

// Requisito 4.7: solo cuenta los registros con fecha dentro del mes y año elegidos.
async function resumenMensual(anio, mes) {
  const { inicio, fin } = rangoDelMes(anio, mes);
  const enElMes = { gte: inicio, lt: fin };

  const [pagos, adelantosRetenidos, devoluciones, aportes, gastos, costosFijos] = await Promise.all([
    prisma.pago.aggregate({ _sum: { monto: true }, where: { fecha: enElMes } }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        fecha: enElMes,
        transmision: { estado: "CANCELADA", decisionAdelanto: "RETENER" },
      },
    }),
    prisma.devolucion.aggregate({ _sum: { monto: true }, where: { fecha: enElMes } }),
    prisma.aporte.aggregate({
      _sum: { valorPesos: true },
      where: { estado: "CUMPLIDO", fechaRecepcion: enElMes },
    }),
    prisma.gasto.aggregate({ _sum: { monto: true }, where: { fecha: enElMes } }),
    costoFijoService.listarPorPeriodo(anio, mes),
  ]);

  const comisiones = await comisionesLiquidadasTemporal({ inicio, fin });
  const perdidasEquipos = await perdidasEquiposTemporal({ inicio, fin });
  const comprasEquipos = await comprasEquiposTemporal({ inicio, fin });

  // Ingresos: pagos del mes (incluye adelantos retenidos) menos devoluciones del mes.
  const ingresos = numero(pagos._sum.monto) - numero(devoluciones._sum.monto);
  const aportesCumplidos = numero(aportes._sum.valorPesos);
  const totalGastos = numero(gastos._sum.monto);

  const rentabilidadTransmisiones =
    ingresos + aportesCumplidos - comisiones - totalGastos - perdidasEquipos;
  const resultadoNeto = rentabilidadTransmisiones - comprasEquipos - costosFijos.total;

  const hoy = new Date();

  return {
    anio,
    mes,
    mesEnCurso: hoy >= inicio && hoy < fin,
    ingresos: {
      pagos: numero(pagos._sum.monto),
      adelantosRetenidos: numero(adelantosRetenidos._sum.monto),
      devoluciones: numero(devoluciones._sum.monto),
      total: ingresos,
    },
    aportesCumplidos,
    comisiones,
    gastos: totalGastos,
    perdidasEquipos,
    rentabilidadTransmisiones,
    comprasEquipos,
    costosFijos: costosFijos.total,
    resultadoNeto,
    pagosPendientes: await pagosPendientesDelMes(inicio, fin),
  };
}

// Requisito 4.6: solo si la transmisión está Rendida o Cerrada.
async function rentabilidadTransmision(transmisionId) {
  const transmision = await prisma.transmision.findUnique({ where: { id: transmisionId } });

  if (!transmision) {
    throw noEncontrado("La transmisión no existe");
  }

  if (!["RENDIDA", "CERRADA"].includes(transmision.estado)) {
    throw conflicto("La rentabilidad solo se revisa cuando la transmisión está Rendida o Cerrada");
  }

  const [pagos, devoluciones, aportes, gastos] = await Promise.all([
    prisma.pago.aggregate({ _sum: { monto: true }, where: { transmisionId } }),
    prisma.devolucion.aggregate({ _sum: { monto: true }, where: { pago: { transmisionId } } }),
    prisma.aporte.aggregate({
      _sum: { valorPesos: true },
      where: { transmisionId, estado: "CUMPLIDO" },
    }),
    prisma.gasto.aggregate({ _sum: { monto: true }, where: { transmisionId } }),
  ]);

  const ingresos = numero(pagos._sum.monto) - numero(devoluciones._sum.monto);
  const aportesCumplidos = numero(aportes._sum.valorPesos);
  const comisiones = await comisionesLiquidadasTemporal({ transmisionId });
  const totalGastos = numero(gastos._sum.monto);
  const perdidasEquipos = await perdidasEquiposTemporal({ transmisionId });

  return {
    transmisionId,
    nombreEvento: transmision.nombreEvento,
    ingresos,
    aportesCumplidos,
    comisiones,
    gastos: totalGastos,
    perdidasEquipos,
    rentabilidad: ingresos + aportesCumplidos - comisiones - totalGastos - perdidasEquipos,
  };
}

module.exports = {
  resumenMensual,
  rentabilidadTransmision,
};