// Pruebas HTTP con sesión y persistencia simuladas; no conectan a la BD de la universidad.
const { test, before, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const service = require("../src/services/equipo.service");
const { manejarErrores } = require("../src/middlewares/error.middleware");
let errorGuardar = null;
let ultimoGuardado;
mock.method(service, "listar", async () => []);
mock.method(service, "listarKits", async () => []);
mock.method(service, "comprasMensuales", async (mes) => ({ mes, cantidad: 0, total: "0", equipos: [] }));
mock.method(service, "guardar", async (...args) => {
  if (errorGuardar) throw errorGuardar;
  ultimoGuardado = args;
  return { id: args[2] ?? 1, ...args[0] };
});
const app = express();
app.use(express.json());
// Solo este servidor de pruebas interpreta este encabezado. La app real usa su cookie.
app.use((req, res, next) => { req.session = { usuario: req.get("x-test-rol") ? { id: 9, rol: req.get("x-test-rol") } : null }; next(); });
app.use("/equipos", require("../src/routes/equipo.routes"));
app.use(manejarErrores);
let server, url;
before(async () => {
  server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  url = `http://127.0.0.1:${server.address().port}/equipos`;
});
after(async () => { await new Promise((resolve) => server.close(resolve)); mock.restoreAll(); });
afterEach(() => { errorGuardar = null; ultimoGuardado = undefined; });
const datos = { nombre: "Cámara", precioCompra: "250000", fechaCompra: "2026-10-20" };
function pedir(rol, method = "GET", ruta = "", body = datos) {
  return fetch(url + ruta, { method, headers: { ...(rol ? { "x-test-rol": rol } : {}), "Content-Type": "application/json" }, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
}

test("sin sesión todas las rutas devuelven 401", async () => {
  for (const [method, ruta] of [["GET", ""], ["GET", "/kits"], ["GET", "/compras-mensuales?mes=2026-10"], ["POST", ""], ["PUT", "/1"]]) {
    assert.equal((await pedir(null, method, ruta)).status, 401);
  }
});
test("Dueño consulta pero no registra ni edita; Contador y roles desconocidos no acceden", async () => {
  assert.equal((await pedir("DUENO")).status, 200);
  assert.equal((await pedir("DUENO", "GET", "/kits")).status, 200);
  assert.equal((await pedir("DUENO", "GET", "/compras-mensuales?mes=2026-10")).status, 200);
  assert.equal((await pedir("DUENO", "POST")).status, 403);
  assert.equal((await pedir("DUENO", "PUT", "/1")).status, 403);
  for (const rol of ["CONTADOR", "OTRO"]) {
    assert.equal((await pedir(rol)).status, 403);
    assert.equal((await pedir(rol, "POST")).status, 403);
  }
});
test("Jefe Técnico y administrador de desarrollo pueden registrar y actualizar", async () => {
  for (const rol of ["JEFE_TECNICO", "ADMIN_DESARROLLO"]) {
    assert.equal((await pedir(rol, "POST")).status, 201);
    assert.equal(ultimoGuardado[1], 9);
    assert.equal((await pedir(rol, "PUT", "/7")).status, 200);
    assert.equal(ultimoGuardado[2], 7);
  }
});
test("valida datos, mes e identificador antes de llegar a la persistencia", async () => {
  assert.equal((await pedir("JEFE_TECNICO", "POST", "", { ...datos, fechaCompra: "2026-02-30" })).status, 400);
  assert.equal((await pedir("JEFE_TECNICO", "PUT", "/abc")).status, 400);
  assert.equal((await pedir("DUENO", "GET", "/compras-mensuales?mes=2026-13")).status, 400);
  assert.equal(ultimoGuardado, undefined);
});
test("duplicados y relaciones inexistentes tienen mensajes controlados", async () => {
  errorGuardar = { code: "P2002", meta: { target: ["numeroSerie"] } };
  let respuesta = await pedir("JEFE_TECNICO", "POST");
  assert.equal(respuesta.status, 409);
  assert.match((await respuesta.json()).message, /número de serie/);
  errorGuardar = { code: "P2002", meta: { target: ["nombre"] } };
  respuesta = await pedir("JEFE_TECNICO", "POST");
  assert.equal(respuesta.status, 409);
  assert.match((await respuesta.json()).message, /kit/);
  errorGuardar = { code: "P2003" };
  assert.equal((await pedir("JEFE_TECNICO", "POST")).status, 400);
  errorGuardar = { code: "P2025" };
  assert.equal((await pedir("JEFE_TECNICO", "PUT", "/123")).status, 404);
});
