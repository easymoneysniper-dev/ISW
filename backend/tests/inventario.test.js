// M3 · Pruebas de kits, asignación a transmisiones, salidas, retornos e incidentes (BD simulada).
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const rutaPrisma = require.resolve("../src/config/prisma");
const prisma = {};
require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prisma };

const kitService = require("../src/services/kit.service");
const kitTransmision = require("../src/services/kitTransmision.service");
const movimientos = require("../src/services/movimiento.service");
const { guardarKitSchema, asignarKitSchema } = require("../src/schemas/kit.schema");
const { registrarSalidasSchema } = require("../src/schemas/movimiento.schema");

const equipo = (id, tipo, extra = {}) => ({ id, nombre: `Equipo ${id}`, tipo, estado: "DISPONIBLE", kitId: null, ...extra });
const completo = [equipo(1, "CAMARA"), equipo(2, "TRIPODE"), equipo(3, "MICROFONO"), equipo(4, "SWITCH")];
const auditorias = [];

beforeEach(() => {
  auditorias.length = 0;
  for (const clave of Object.keys(prisma)) delete prisma[clave];
  prisma.registroCambio = { create: async ({ data }) => auditorias.push(data) };
  prisma.$transaction = async (fn) => fn(prisma);
});

test("3.2: kit sin cámara, trípode, micrófono o switch exige aceptar la advertencia para salir", async () => {
  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA")], updateMany: async () => {} };
  prisma.kit = {
    create: async ({ data }) => ({ id: 7, ...data }),
    findUnique: async () => ({ id: 7, nombre: "Kit A", categoria: "NUEVO", enCondiciones: true, equipos: [equipo(1, "CAMARA")] }),
  };
  const datos = guardarKitSchema.parse({ nombre: "Kit A", categoria: "NUEVO", enCondiciones: true, equipoIds: [1] });
  await assert.rejects(kitService.guardar(datos, 1), { status: 409, message: /trípode, micrófono, switch/ });

  const { kit, advertencias } = await kitService.guardar({ ...datos, aceptarAdvertencia: true }, 1);
  assert.equal(kit.recargo, 15);
  assert.deepEqual(kit.faltantes, ["trípode", "micrófono", "switch"]);
  assert.match(advertencias[0], /Al kit le falta/);
  assert.match(auditorias[0].detalle, /aceptó que falta/);
});

test("3.2: solo entran equipos disponibles que no estén en otro kit", async () => {
  const datos = { nombre: "Kit B", categoria: "ANTIGUO", enCondiciones: false, equipoIds: [1, 2] };
  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA"), equipo(2, "TRIPODE", { estado: "DANADO" })] };
  await assert.rejects(kitService.guardar(datos, 1), { status: 409, message: /disponibles/ });
  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA"), equipo(2, "TRIPODE", { kitId: 9 })] };
  await assert.rejects(kitService.guardar(datos, 1), { status: 409, message: /otro kit/ });
  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA")] };
  await assert.rejects(kitService.guardar(datos, 1), { status: 400, message: /no están registrados/ });
});

test("3.2: los datos del kit se validan (clasificación, equipos y sin repetidos)", () => {
  const base = { nombre: "Kit", categoria: "NUEVO", enCondiciones: true, equipoIds: [1, 2] };
  assert.equal(guardarKitSchema.safeParse(base).success, true);
  assert.equal(guardarKitSchema.safeParse({ ...base, categoria: "VIEJO" }).success, false);
  assert.equal(guardarKitSchema.safeParse({ ...base, equipoIds: [] }).success, false);
  assert.equal(guardarKitSchema.safeParse({ ...base, equipoIds: [1, 1] }).success, false);
  assert.equal(asignarKitSchema.parse({ kitId: "3" }).aceptarAdvertencia, false);
});

const hora = (h) => new Date(Date.UTC(2026, 11, 5, h));
const transmision = { id: 1, nombreEvento: "Licenciatura", estado: "ACEPTADA", inicio: hora(15), termino: hora(18), tiempoTrasladoMin: 30, requiereAdelanto: false };

test("3.5: kit fuera de condiciones o en otra transmisión que choca: se rechaza o pide aceptar", async () => {
  prisma.transmision = {
    findUnique: async () => transmision,
    findMany: async () => [{ id: 2, nombreEvento: "Aniversario", inicio: hora(18), termino: hora(20), tiempoTrasladoMin: 60 }],
    update: async ({ data }) => ({ ...transmision, precioBase: 100000, ajuste: 0, precioCotizado: data.precioCotizado, requiereAdelanto: data.requiereAdelanto }),
  };
  prisma.transmisionKit = { findUnique: async () => null, create: async () => {} };

  prisma.kit = { findUnique: async () => ({ id: 3, nombre: "Kit A", categoria: "NUEVO", enCondiciones: false }) };
  await assert.rejects(kitTransmision.asignar(1, { kitId: 3 }, 1), { status: 409, message: /no está en condiciones/ });

  prisma.kit = { findUnique: async () => ({ id: 3, nombre: "Kit A", categoria: "NUEVO", enCondiciones: true }) };
  await assert.rejects(kitTransmision.asignar(1, { kitId: 3 }, 1), { status: 409, message: /comprometido en: Aniversario/ });

  prisma.transmision.findUnique = async ({ include }) => (include
    ? { ...transmision, precioBase: "100000", ajuste: "0", kits: [{ recargoAplicado: "15" }] }
    : transmision);
  const { transmision: actualizada, advertencias } = await kitTransmision.asignar(1, { kitId: 3, aceptarAdvertencia: true }, 1);
  assert.equal(actualizada.precioCotizado, 115000);
  assert.match(advertencias[0], /Aniversario/);
});

test("3.5: no se asignan kits a transmisiones canceladas", async () => {
  prisma.transmision = { findUnique: async () => ({ ...transmision, estado: "CANCELADA" }) };
  await assert.rejects(kitTransmision.asignar(1, { kitId: 3 }, 1), { status: 409, message: /Cotizadas, Aceptadas o Confirmadas/ });
});

test("3.3: solo salen equipos de kits asignados o repuestos disponibles que no estén fuera", async () => {
  const datos = registrarSalidasSchema.parse({ transmisionId: 1, salidas: [{ equipoId: 1, responsableId: 5 }] });
  prisma.transmision = { findUnique: async () => ({ id: 1, nombreEvento: "Lic", estado: "CONFIRMADA", kits: [{ kitId: 3 }] }) };
  prisma.trabajador = { findMany: async () => [{ id: 5 }] };
  prisma.salidaEquipo = { findMany: async () => [], create: async ({ data }) => ({ id: 10, ...data, equipo: { nombre: "Equipo 1" } }) };

  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA", { kitId: 8 })] };
  await assert.rejects(movimientos.registrarSalidas(datos, 1), { status: 409, message: /kit que no está asignado/ });

  prisma.equipo = { findMany: async () => [equipo(1, "CAMARA", { kitId: 3 })] };
  prisma.salidaEquipo.findMany = async () => [{ equipoId: 1 }];
  await assert.rejects(movimientos.registrarSalidas(datos, 1), { status: 409, message: /fuera de bodega/ });

  prisma.salidaEquipo.findMany = async () => [];
  const creadas = await movimientos.registrarSalidas(datos, 1);
  assert.equal(creadas.length, 1);

  prisma.transmision.findUnique = async () => ({ id: 1, estado: "COTIZADA", kits: [] });
  await assert.rejects(movimientos.registrarSalidas(datos, 1), { status: 409, message: /Confirmadas o Realizadas/ });
});

test("3.3 y 3.4: retorno dañado pide incidente, y el incidente debe calzar con el retorno", async () => {
  const salida = { id: 10, fechaRetorno: null, estadoRetorno: null, incidente: null, equipo: { id: 1, nombre: "Cámara" }, responsable: { nombre: "Ana" } };
  prisma.salidaEquipo = {
    findUnique: async () => salida,
    update: async ({ data }) => ({ ...salida, ...data }),
  };
  const retorno = await movimientos.registrarRetorno(10, "DANADO", 1);
  assert.equal(retorno.requiereIncidente, true);

  Object.assign(salida, { fechaRetorno: new Date(), estadoRetorno: "DANADO" });
  await assert.rejects(movimientos.registrarRetorno(10, "BUEN_ESTADO", 1), { status: 409, message: /ya fue registrado/ });
  await assert.rejects(movimientos.registrarIncidente(10, { tipo: "ROBO", observacion: "x" }, 1), { status: 400, message: /DANO/ });

  let nuevoEstado;
  prisma.incidente = { create: async ({ data }) => ({ id: 1, ...data }) };
  prisma.equipo = { update: async ({ data }) => { nuevoEstado = data.estado; } };
  const incidente = await movimientos.registrarIncidente(10, { tipo: "DANO", observacion: "Lente rayado" }, 1);
  assert.equal(nuevoEstado, "DANADO");
  assert.equal(incidente.responsable.nombre, "Ana");

  Object.assign(salida, { incidente: { id: 1 } });
  await assert.rejects(movimientos.registrarIncidente(10, { tipo: "DANO", observacion: "x" }, 1), { status: 409, message: /ya tiene un incidente/ });
});

test("3.4: un equipo que volvió bien no lleva incidente; uno no devuelto queda perdido", async () => {
  const salida = { id: 11, fechaRetorno: new Date(), estadoRetorno: "BUEN_ESTADO", incidente: null, equipo: { id: 2, nombre: "Trípode" }, responsable: { nombre: "Bruno" } };
  prisma.salidaEquipo = { findUnique: async () => salida };
  await assert.rejects(movimientos.registrarIncidente(11, { tipo: "DANO", observacion: "x" }, 1), { status: 409 });

  salida.estadoRetorno = "NO_DEVUELTO";
  let nuevoEstado;
  prisma.incidente = { create: async ({ data }) => ({ id: 2, ...data }) };
  prisma.equipo = { update: async ({ data }) => { nuevoEstado = data.estado; } };
  await movimientos.registrarIncidente(11, { tipo: "ROBO", observacion: "Robado en el traslado" }, 1);
  assert.equal(nuevoEstado, "PERDIDO");
});
