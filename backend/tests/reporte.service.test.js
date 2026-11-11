// Pruebas de la rentabilidad por transmisión (M4, requisito 4.6) sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

// Cada aggregate devuelve la suma que se le indique en "sumas".
const sumas = { pago: 0, devolucion: 0, aporte: 0, gasto: 0 };
const suma = (modelo, campo) => async () => ({ _sum: { [campo]: sumas[modelo] } });
const prisma = {
  transmision: {},
  pago: { aggregate: suma("pago", "monto") },
  devolucion: { aggregate: suma("devolucion", "monto") },
  aporte: { aggregate: suma("aporte", "valorPesos") },
  gasto: { aggregate: suma("gasto", "monto") },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const reporteService = require("../src/services/reporte.service");
const { ErrorNegocio } = require("../src/utils/errores");

async function rechazaCon(promesa, status, mensaje) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ErrorNegocio);
    assert.equal(error.status, status);
    assert.equal(error.message, mensaje);
    return true;
  });
}

test("rentabilidad: transmisión que no existe lanza 404", async () => {
  prisma.transmision.findUnique = async () => null;
  await rechazaCon(reporteService.rentabilidadTransmision(99), 404, "La transmisión no existe");
});

test("rentabilidad: transmisión que no está Rendida ni Cerrada lanza 409", async () => {
  prisma.transmision.findUnique = async () => ({ id: 1, estado: "REALIZADA" });
  await rechazaCon(
    reporteService.rentabilidadTransmision(1),
    409,
    "La rentabilidad solo se revisa cuando la transmisión está Rendida o Cerrada"
  );
});

test("rentabilidad: transmisión rendida devuelve el cálculo directo", async () => {
  prisma.transmision.findUnique = async () => ({ id: 3, estado: "RENDIDA", nombreEvento: "Final" });
  Object.assign(sumas, { pago: 200000, devolucion: 0, aporte: 50000, gasto: 21400 });
  const resultado = await reporteService.rentabilidadTransmision(3);
  assert.equal(resultado.ingresos, 200000);
  assert.equal(resultado.gastos, 21400);
  // 200000 + 50000 - 0 comisiones - 21400 gastos - 0 pérdidas (M2 y M3 aún en 0)
  assert.equal(resultado.rentabilidad, 228600);
  assert.equal(resultado.resultado, undefined);
});