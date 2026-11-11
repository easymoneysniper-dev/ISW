// Pruebas de las reglas de gastos y rendición (M4, requisito 4.2) sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

const prisma = {
  transmision: { update: async ({ data }) => ({ id: 3, ...data }) },
  gasto: { create: async ({ data }) => ({ id: 1, ...data }) },
  registroCambio: { create: async () => ({}) },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const gastoService = require("../src/services/gasto.service");
const { ErrorNegocio } = require("../src/utils/errores");

// Transmisión Realizada sin rendición.
function transmisionRealizada(cambios = {}) {
  return { id: 3, estado: "REALIZADA", fechaRendicion: null, gastos: [], ...cambios };
}

const gastoBase = { transmisionId: 3, categoria: "PEAJE", monto: 3200 };

async function rechazaCon(promesa, status, mensaje) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ErrorNegocio);
    assert.equal(error.status, status);
    assert.equal(error.message, mensaje);
    return true;
  });
}

test("listarPorTransmision: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(gastoService.listarPorTransmision(99), 404, "Transmisión no encontrada");
});

test("registrar: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(gastoService.registrar(gastoBase), 404, "La transmisión no existe");
});

test("registrar: transmisión cotizada lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada({ estado: "COTIZADA" });
  await rechazaCon(
    gastoService.registrar(gastoBase),
    409,
    "No se pueden registrar gastos de una transmisión cotizada"
  );
});

test("registrar: rendición completa lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada({ fechaRendicion: new Date() });
  await rechazaCon(
    gastoService.registrar(gastoBase),
    409,
    "La rendición ya está completa; no se aceptan nuevos gastos"
  );
});

test("registrar: gasto válido devuelve el gasto directo", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada();
  const gasto = await gastoService.registrar(gastoBase);
  assert.equal(gasto.categoria, "PEAJE");
  assert.equal(gasto.monto, 3200);
  assert.equal(gasto.gasto, undefined);
});

test("completarRendicion: transmisión no realizada lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada({ estado: "ACEPTADA" });
  await rechazaCon(
    gastoService.completarRendicion(1),
    409,
    "Solo se puede completar la rendición de una transmisión realizada"
  );
});

test("completarRendicion: rendición ya completa lanza 409", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada({ fechaRendicion: new Date() });
  await rechazaCon(
    gastoService.completarRendicion(3),
    409,
    "La rendición de esta transmisión ya está completa"
  );
});

test("completarRendicion: transmisión realizada devuelve la fecha", async () => {
  prisma.transmision.findUnique = async () => transmisionRealizada();
  const resultado = await gastoService.completarRendicion(3);
  assert.equal(resultado.transmisionId, 3);
  assert.ok(resultado.fechaRendicion instanceof Date);
});