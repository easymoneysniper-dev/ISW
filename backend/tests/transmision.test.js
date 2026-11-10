// Pruebas automáticas de M1 (transmisiones). Se ejecutan con: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");

// Prisma se reemplaza por un doble antes de cargar los services (no se usa la BD real).
const rutaPrisma = require.resolve("../src/config/prisma");
const prisma = {};
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const { calcularCotizacion, recargoPorCategoria } = require("../src/services/cotizacion.service");
const { hayConflicto, fechaChile } = require("../src/utils/horario");
const s = require("../src/schemas/transmision.schema");
const estado = require("../src/services/transmisionEstado.service");

const hora = (h, m = 0) => new Date(Date.UTC(2026, 11, 5, h, m));
const base = { precioBase: 100000, ajuste: 0, inicio: hora(15), termino: hora(17), zona: "LOCAL" };

test("1.2: precio = base + recargos por kit + ajuste", () => {
  const { precioCotizado } = calcularCotizacion({ ...base, ajuste: -5000, recargos: [15, 10, 0] });
  assert.equal(precioCotizado, 100000 + 25000 - 5000);
  assert.deepEqual([recargoPorCategoria("NUEVO"), recargoPorCategoria("INTERMEDIO"), recargoPorCategoria("ANTIGUO")], [15, 10, 0]);
});

test("1.2: adelanto si dura 5 h o más, usa 3 kits o más, o es en regiones", () => {
  assert.equal(calcularCotizacion(base).requiereAdelanto, false);
  assert.equal(calcularCotizacion({ ...base, termino: hora(20) }).requiereAdelanto, true);
  assert.equal(calcularCotizacion({ ...base, recargos: [0, 0, 0] }).requiereAdelanto, true);
  assert.equal(calcularCotizacion({ ...base, zona: "REGIONES" }).requiereAdelanto, true);
});

test("choque de horario considera el traslado de la que empieza después", () => {
  const manana = { inicio: hora(10), termino: hora(12), tiempoTrasladoMin: 0 };
  assert.equal(hayConflicto(manana, { inicio: hora(13), termino: hora(15), tiempoTrasladoMin: 30 }), false);
  assert.equal(hayConflicto(manana, { inicio: hora(12, 20), termino: hora(15), tiempoTrasladoMin: 30 }), true);
  assert.equal(hayConflicto(manana, { inicio: hora(11), termino: hora(13), tiempoTrasladoMin: 0 }), true);
});

test("el calendario usa la fecha de Chile, no la UTC", () => {
  assert.equal(fechaChile(new Date("2026-12-06T02:00:00Z")), "2026-12-05"); // 23:00 en Chile
});

test("1.1: valida datos completos, término posterior al inicio y cámaras mayor que cero", () => {
  const datos = {
    clienteId: 1, nombreEvento: "Licenciatura", inicio: "2026-12-05T15:00:00-03:00",
    termino: "2026-12-05T18:00:00-03:00", lugar: "Aula Magna", zona: "LOCAL",
    cantidadCamaras: 2, tiempoTrasladoMin: 0, precioBase: 150000, ajuste: 0,
  };
  assert.equal(s.crearTransmisionSchema.safeParse(datos).success, true);
  assert.equal(s.crearTransmisionSchema.safeParse({ ...datos, cantidadCamaras: 0 }).success, false);
  assert.equal(s.crearTransmisionSchema.safeParse({ ...datos, termino: datos.inicio }).success, false);
  const { lugar, ...sinLugar } = datos;
  assert.equal(s.crearTransmisionSchema.safeParse(sinLugar).success, false);
  assert.equal(s.crearTransmisionSchema.safeParse({ ...datos, cliente: { nombre: "X", telefono: "912345678" } }).success, false);
});

test("1.5: rendida solo con asistencia, equipos de vuelta y rendición", () => {
  const lista = {
    fechaRendicion: new Date(),
    asignaciones: [{ estado: "ASIGNADO", asistencia: "ASISTIO" }, { estado: "RETIRADO", asistencia: "PENDIENTE" }],
    salidas: [{ fechaRetorno: new Date(), estadoRetorno: "BUEN_ESTADO", incidente: null }],
  };
  assert.equal(estado.puedeRendirse(lista), true);
  assert.equal(estado.puedeRendirse({ ...lista, fechaRendicion: null }), false);
  assert.equal(estado.puedeRendirse({ ...lista, salidas: [{ fechaRetorno: new Date(), estadoRetorno: "DANADO", incidente: null }] }), false);
});

test("1.5: cerrada solo con pago completo y comisiones liquidadas", () => {
  const lista = {
    precioCotizado: "150000",
    pagos: [{ monto: "75000" }, { monto: "75000" }],
    asignaciones: [{ estado: "ASIGNADO", asistencia: "ASISTIO", fechaLiquidacion: new Date() }],
  };
  assert.equal(estado.puedeCerrarse(lista), true);
  assert.equal(estado.puedeCerrarse({ ...lista, pagos: [{ monto: "75000" }] }), false);
  assert.equal(estado.puedeCerrarse({ ...lista, asignaciones: [{ estado: "ASIGNADO", asistencia: "ASISTIO", fechaLiquidacion: null }] }), false);
});

test("1.3: solo se responde una transmisión Cotizada", async () => {
  prisma.transmision = {
    findMany: async () => [],
    findUnique: async () => ({ id: 1, estado: "ACEPTADA" }),
  };
  const resultado = await estado.responder(1, "ACEPTADA", 1);
  assert.equal(resultado.status, 409);
});
