// Pruebas de las reglas de auspiciadores y aportes sin base de datos.
// Usan un doble de Prisma: un objeto falso que reemplaza a src/config/prisma.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");

const prisma = {
  auspiciador: { create: async ({ data }) => ({ id: 1, ...data }) },
  transmision: {},
  aporte: {
    create: async ({ data }) => ({ id: 1, estado: "COMPROMETIDO", ...data }),
    update: async ({ where, data }) => ({ ...aporteGuardado, id: where.id, ...data }),
  },
  registroCambio: { create: async () => ({}) },
};
const rutaPrisma = require.resolve("../src/config/prisma");
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const aporteService = require("../src/services/aporte.service");
const auspiciadorService = require("../src/services/auspiciador.service");
const { ErrorNegocio } = require("../src/utils/errores");

const DIA_MS = 24 * 60 * 60 * 1000;
let aporteGuardado = null;

// Canje de una radio, comprometido para mañana.
function canjeComprometido(cambios = {}) {
  return {
    id: 5,
    tipo: "CANJE",
    descripcion: "Publicidad radial",
    valorPesos: null,
    fechaComprometida: new Date(Date.now() + DIA_MS),
    estado: "COMPROMETIDO",
    ...cambios,
  };
}

async function rechazaCon(promesa, status, mensaje) {
  await assert.rejects(promesa, (error) => {
    assert.ok(error instanceof ErrorNegocio);
    assert.equal(error.status, status);
    assert.equal(error.message, mensaje);
    return true;
  });
}

test("auspiciador: nombre repetido lanza 409", async () => {
  prisma.auspiciador.findFirst = async () => ({ id: 1, nombre: "Radio Bío-Bío" });
  await rechazaCon(
    auspiciadorService.registrar({ nombre: "radio bío-bío", contacto: "contacto@radio.cl" }),
    409,
    'Ya existe el auspiciador "Radio Bío-Bío"'
  );
});

test("estadoActual: comprometido con la fecha vencida se muestra Atrasado", () => {
  const hoy = new Date(Date.UTC(2026, 10, 11));
  assert.equal(
    aporteService.estadoActual({ estado: "COMPROMETIDO", fechaComprometida: new Date(Date.UTC(2026, 10, 10)) }, hoy),
    "ATRASADO"
  );
  assert.equal(
    aporteService.estadoActual({ estado: "COMPROMETIDO", fechaComprometida: hoy }, hoy),
    "COMPROMETIDO"
  );
  assert.equal(
    aporteService.estadoActual({ estado: "CUMPLIDO", fechaComprometida: new Date(Date.UTC(2026, 10, 1)) }, hoy),
    "CUMPLIDO"
  );
});

test("acuerdo: auspiciador que no existe lanza 404", async () => {
  prisma.auspiciador.findUnique = async () => null;
  prisma.transmision.findUnique = async () => ({ id: 1 });
  await rechazaCon(
    aporteService.registrarAcuerdo({ auspiciadorId: 9, transmisionId: 1, tipo: "DINERO", valorPesos: 50000 }),
    404,
    "El auspiciador no existe"
  );
});

test("acuerdo: queda Comprometido y un canje se guarda sin valor", async () => {
  prisma.auspiciador.findUnique = async () => ({ id: 1, nombre: "Radio" });
  prisma.transmision.findUnique = async () => ({ id: 1 });
  const aporte = await aporteService.registrarAcuerdo({
    auspiciadorId: 1,
    transmisionId: 1,
    tipo: "CANJE",
    descripcion: "Publicidad radial",
    valorPesos: 80000,
    fechaComprometida: new Date(Date.now() + DIA_MS),
  });
  assert.equal(aporte.estado, "COMPROMETIDO");
  assert.equal(aporte.valorPesos, null);
});

test("recepción: canje sin valor en pesos lanza 400", async () => {
  aporteGuardado = canjeComprometido();
  prisma.aporte.findUnique = async () => aporteGuardado;
  await rechazaCon(
    aporteService.registrarRecepcion(5, { fechaRecepcion: new Date(), comprobanteArchivo: "acta.pdf" }),
    400,
    "Indica el valor en pesos del canje"
  );
});

test("recepción: aporte ya Cumplido lanza 409", async () => {
  aporteGuardado = canjeComprometido({ estado: "CUMPLIDO" });
  prisma.aporte.findUnique = async () => aporteGuardado;
  await rechazaCon(
    aporteService.registrarRecepcion(5, { fechaRecepcion: new Date(), valorPesos: 80000, comprobanteArchivo: "acta.pdf" }),
    409,
    "Solo se registra la recepción de un aporte Comprometido o Atrasado"
  );
});

test("recepción: canje atrasado queda Cumplido con su valor", async () => {
  aporteGuardado = canjeComprometido({ fechaComprometida: new Date(Date.now() - 3 * DIA_MS) });
  prisma.aporte.findUnique = async () => aporteGuardado;
  const aporte = await aporteService.registrarRecepcion(5, {
    fechaRecepcion: new Date(),
    valorPesos: 80000,
    comprobanteArchivo: "acta.pdf",
  });
  assert.equal(aporte.estado, "CUMPLIDO");
  assert.equal(aporte.estadoActual, "CUMPLIDO");
  assert.equal(aporte.valorPesos, 80000);
});

test("no cumplido: aporte que no existe lanza 404", async () => {
  prisma.aporte.findUnique = async () => null;
  await rechazaCon(aporteService.marcarNoCumplido(99, "No respondió"), 404, "El aporte no existe");
});

test("no cumplido: aporte ya No cumplido lanza 409", async () => {
  aporteGuardado = canjeComprometido({ estado: "NO_CUMPLIDO" });
  prisma.aporte.findUnique = async () => aporteGuardado;
  await rechazaCon(
    aporteService.marcarNoCumplido(5, "No respondió"),
    409,
    "Solo se marca como No cumplido un aporte Comprometido o Atrasado"
  );
});