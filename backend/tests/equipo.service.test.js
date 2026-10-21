const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
// Prisma usa proxies; se sustituye el módulo por un doble antes de cargar el service.
require("../src/config/prisma");
const prisma = { $transaction: async () => {}, equipo: { findMany: async () => [] } };
require.cache[require.resolve("../src/config/prisma")].exports = prisma;
const service = require("../src/services/equipo.service");
afterEach(() => mock.restoreAll());

test("ficha, kit y auditoría usan la misma transacción y la fecha no pierde un día", async () => {
  const operaciones = [];
  mock.method(prisma, "$transaction", async (fn) => fn({
    kit: { create: async () => { operaciones.push("kit"); return { id: 3 }; } },
    equipo: { create: async ({ data }) => {
      operaciones.push("equipo");
      assert.equal(data.kitId, 3);
      assert.equal(data.fechaCompra.toISOString(), "2026-10-01T00:00:00.000Z");
      assert.equal("nuevoKitNombre" in data, false);
      return { id: 5, ...data };
    } },
    registroCambio: { create: async ({ data }) => {
      operaciones.push("auditoria");
      assert.equal(data.usuarioId, 9); assert.equal(data.entidadId, 5); assert.equal(data.accion, "CREAR");
    } },
  }));
  await service.guardar({ nombre: "Cámara", fechaCompra: "2026-10-01", nuevoKitNombre: "Kit A", kitId: null, estado: "DISPONIBLE" }, 9);
  assert.deepEqual(operaciones, ["kit", "equipo", "auditoria"]);
});

test("el fallo de auditoría se propaga para que Prisma revierta la transacción", async () => {
  mock.method(prisma, "$transaction", async (fn) => fn({
    equipo: { update: async ({ where, data }) => ({ id: where.id, ...data }) },
    registroCambio: { create: async () => { throw new Error("fallo de auditoría"); } },
  }));
  await assert.rejects(service.guardar({ nombre: "Cámara", fechaCompra: "2026-10-01", estado: "DADO_DE_BAJA", kitId: null }, 9, 5), /fallo de auditoría/);
});

test("compras usa límites de mes exclusivos, también en diciembre, sin filtrar estados", async () => {
  mock.method(prisma.equipo, "findMany", async ({ where }) => {
    assert.deepEqual(Object.keys(where), ["fechaCompra"]);
    assert.equal(where.fechaCompra.gte.toISOString(), "2026-12-01T00:00:00.000Z");
    assert.equal(where.fechaCompra.lt.toISOString(), "2027-01-01T00:00:00.000Z");
    return [{ precioCompra: "99999999999999", estado: "DADO_DE_BAJA" }, { precioCompra: "2", estado: "DISPONIBLE" }];
  });
  const reporte = await service.comprasMensuales("2026-12");
  assert.equal(reporte.total, "100000000000001");
  assert.equal(reporte.cantidad, 2);
});
test("mes sin compras devuelve total cero y una lista vacía", async () => {
  mock.method(prisma.equipo, "findMany", async () => []);
  assert.deepEqual(await service.comprasMensuales("2026-02"), { mes: "2026-02", cantidad: 0, total: "0", equipos: [] });
});
