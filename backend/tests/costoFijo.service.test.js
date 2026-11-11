// Pruebas de las reglas de costos fijos (M4, requisito 4.3) sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

const prisma = {
  costoFijo: {
    create: async ({ data }) => ({ id: 1, ...data }),
    delete: async () => ({}),
  },
  registroCambio: { create: async () => ({}) },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const costoFijoService = require("../src/services/costoFijo.service");
const { ErrorNegocio } = require("../src/utils/errores");

const luz = { nombre: "Luz", monto: 45000, anio: 2026, mes: 11 };

async function rechazaCon(promesa, status, mensaje) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ErrorNegocio);
    assert.equal(error.status, status);
    assert.equal(error.message, mensaje);
    return true;
  });
}

test("registrar: nombre repetido en el mismo mes lanza 409", async () => {
  prisma.costoFijo.findFirst = async () => ({ id: 1, ...luz });
  await rechazaCon(
    costoFijoService.registrar({ ...luz, nombre: "luz" }),
    409,
    'Ya existe el costo fijo "Luz" en 11/2026'
  );
});

test("registrar: costo fijo válido devuelve el costo directo", async () => {
  prisma.costoFijo.findFirst = async () => null;
  const costo = await costoFijoService.registrar(luz);
  assert.equal(costo.nombre, "Luz");
  assert.equal(costo.monto, 45000);
  assert.equal(costo.costo, undefined);
});

test("eliminar: costo fijo que no existe lanza 404", async () => {
  prisma.costoFijo.findUnique = async () => null;
  await rechazaCon(costoFijoService.eliminar(99), 404, "El costo fijo no existe");
});