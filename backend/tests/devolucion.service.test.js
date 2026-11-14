// Pruebas de las reglas de la devolución del adelanto (M4, requisito 4.8) sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

const prisma = {
  transmision: {},
  devolucion: { create: async ({ data }) => ({ id: 1, ...data }) },
  registroCambio: { create: async () => ({}) },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const devolucionService = require("../src/services/devolucion.service");
const { ErrorNegocio } = require("../src/utils/errores");

// Transmisión cancelada con el adelanto de $100.000 pagado y marcado para devolver.
function transmisionCancelada(cambios = {}) {
  return {
    id: 1,
    estado: "CANCELADA",
    decisionAdelanto: "DEVOLVER",
    pagos: [{ id: 7, tipo: "ADELANTO", monto: 100000, devolucion: null }],
    ...cambios,
  };
}

const devolucionBase = {
  transmisionId: 1,
  monto: 100000,
  fecha: new Date("2026-11-10"),
  medio: "TRANSFERENCIA",
  comprobanteArchivo: "comprobante.pdf",
};

async function rechazaCon(promesa, status, mensaje) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ErrorNegocio);
    assert.equal(error.status, status);
    assert.equal(error.message, mensaje);
    return true;
  });
}

test("registrar: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(devolucionService.registrar(devolucionBase), 404, "La transmisión no existe");
});

test("registrar: transmisión cancelada que retiene el adelanto lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionCancelada({ decisionAdelanto: "RETENER" });
  await rechazaCon(
    devolucionService.registrar(devolucionBase),
    409,
    "Solo se registra la devolución de una transmisión cancelada con el adelanto marcado para devolver"
  );
});

test("registrar: transmisión que no está cancelada lanza 409", async () => {
  prisma.transmision.findUnique = async () =>
    transmisionCancelada({ estado: "CONFIRMADA", decisionAdelanto: null });
  await rechazaCon(
    devolucionService.registrar(devolucionBase),
    409,
    "Solo se registra la devolución de una transmisión cancelada con el adelanto marcado para devolver"
  );
});

test("registrar: devolución repetida lanza 409", async () => {
  prisma.transmision.findUnique = async () =>
    transmisionCancelada({
      pagos: [{ id: 7, tipo: "ADELANTO", monto: 100000, devolucion: { id: 1, monto: 100000 } }],
    });
  await rechazaCon(
    devolucionService.registrar(devolucionBase),
    409,
    "La devolución del adelanto ya está registrada"
  );
});

test("registrar: monto mayor a lo pagado lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionCancelada();
  await rechazaCon(
    devolucionService.registrar({ ...devolucionBase, monto: 150000 }),
    409,
    "El monto supera lo pagado ($100000)"
  );
});

test("registrar: devolución válida queda ligada al pago del adelanto", async () => {
  prisma.transmision.findUnique = async () => transmisionCancelada();
  const devolucion = await devolucionService.registrar(devolucionBase);
  assert.equal(devolucion.pagoId, 7);
  assert.equal(devolucion.monto, 100000);
  assert.equal(devolucion.transmisionId, undefined);
});

test("obtenerPorTransmision: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(devolucionService.obtenerPorTransmision(99), 404, "Transmisión no encontrada");
});

test("obtenerPorTransmision: sin devolución todavía, se puede registrar", async () => {
  prisma.transmision.findUnique = async () => transmisionCancelada();
  const resumen = await devolucionService.obtenerPorTransmision(1);
  assert.equal(resumen.totalPagado, 100000);
  assert.equal(resumen.devolucion, null);
  assert.equal(resumen.puedeRegistrar, true);
});