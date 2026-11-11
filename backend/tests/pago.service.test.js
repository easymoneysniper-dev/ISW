// Pruebas de las reglas de pagos (M4, requisito 4.1) sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

const prisma = {
  transmision: {},
  pago: { create: async ({ data }) => ({ id: 1, ...data }) },
  registroCambio: { create: async () => ({}) },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const pagoService = require("../src/services/pago.service");
const { ErrorNegocio } = require("../src/utils/errores");

// Transmisión Aceptada de $200.000 con el adelanto de $100.000 ya pagado.
function transmisionConAdelanto(cambios = {}) {
  return {
    id: 1,
    estado: "ACEPTADA",
    precioCotizado: 200000,
    requiereAdelanto: true,
    termino: new Date(Date.now() + 24 * 60 * 60 * 1000),
    pagos: [{ id: 1, tipo: "ADELANTO", monto: 100000 }],
    ...cambios,
  };
}

const pagoBase = { transmisionId: 1, tipo: "SALDO", monto: 100000, medio: "TRANSFERENCIA" };

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
  await rechazaCon(pagoService.registrar(pagoBase), 404, "La transmisión no existe");
});

test("registrar: transmisión cancelada lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionConAdelanto({ estado: "CANCELADA" });
  await rechazaCon(
    pagoService.registrar(pagoBase),
    409,
    "No se pueden registrar pagos de una transmisión cancelada"
  );
});

test("registrar: monto mayor al saldo lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionConAdelanto();
  await rechazaCon(
    pagoService.registrar({ ...pagoBase, monto: 500000 }),
    409,
    "El monto supera el saldo pendiente ($100000)"
  );
});

test("registrar: adelanto ya cubierto lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionConAdelanto();
  await rechazaCon(
    pagoService.registrar({ ...pagoBase, tipo: "ADELANTO", monto: 50000 }),
    409,
    "El adelanto ya está cubierto; registra el pago como SALDO"
  );
});

test("registrar: pago válido devuelve el pago directo", async () => {
  prisma.transmision.findUnique = async () => transmisionConAdelanto();
  const pago = await pagoService.registrar(pagoBase);
  assert.equal(pago.tipo, "SALDO");
  assert.equal(pago.monto, 100000);
  assert.equal(pago.pago, undefined);
});

test("obtenerResumen: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(pagoService.obtenerResumen(99), 404, "Transmisión no encontrada");
});

test("contrato con M1: resumenPorTransmision sigue devolviendo null", async () => {
  prisma.transmision.findUnique = async () => null;
  assert.equal(await pagoService.resumenPorTransmision(99), null);
  assert.equal(await pagoService.adelantoRecibido(99), false);
  assert.equal(await pagoService.saldoPagado(99), false);
});