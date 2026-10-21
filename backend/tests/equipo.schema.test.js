const test = require("node:test");
const assert = require("node:assert/strict");
const { guardarEquipoSchema: schema, mesComprasSchema } = require("../src/schemas/equipo.schema");
const base = { nombre: " Cámara ", precioCompra: "150000", fechaCompra: "2026-10-20" };

test("nombre, precio y fecha son obligatorios; marca, modelo y serie son opcionales", () => {
  const datos = schema.parse(base);
  assert.equal(datos.nombre, "Cámara");
  assert.equal(datos.numeroSerie, null);
  assert.equal(datos.kitId, null);
  assert.equal(datos.estado, "DISPONIBLE");
  for (const campo of ["nombre", "precioCompra", "fechaCompra"]) {
    const incompleto = { ...base }; delete incompleto[campo];
    assert.equal(schema.safeParse(incompleto).success, false, campo);
  }
  assert.equal(schema.safeParse({ ...base, nombre: "   " }).success, false);
});

test("serie sin espacios exteriores, en mayúsculas o nula", () => {
  assert.equal(schema.parse({ ...base, numeroSerie: " ab-123 " }).numeroSerie, "AB-123");
  assert.equal(schema.parse({ ...base, numeroSerie: " " }).numeroSerie, null);
});

test("rechaza precios vacíos, negativos, fracciones, booleanos y fuera de rango", () => {
  for (const precioCompra of ["", " ", "-10", 0, "0", 1.5, "1.5", "100000000000000", true, null, "NaN"]) {
    assert.equal(schema.safeParse({ ...base, precioCompra }).success, false, String(precioCompra));
  }
  assert.equal(schema.parse({ ...base, precioCompra: "99999999999999" }).precioCompra, "99999999999999");
});

test("comprueba fechas reales y años bisiestos sin conversiones de zona horaria", () => {
  for (const fechaCompra of ["2026-02-29", "2026-04-31", "2026-13-01", "", "20/10/2026", "0000-01-01"]) {
    assert.equal(schema.safeParse({ ...base, fechaCompra }).success, false, fechaCompra);
  }
  assert.equal(schema.safeParse({ ...base, fechaCompra: "2024-02-29" }).success, true);
});

test("solo estados válidos, sin campos extra y una única ubicación", () => {
  for (const estado of ["DISPONIBLE", "DANADO", "EN_REPARACION", "PERDIDO", "DADO_DE_BAJA"]) {
    assert.equal(schema.safeParse({ ...base, estado }).success, true);
  }
  for (const extra of [{ estado: "ROTO" }, { rol: "DUENO" }, { kitId: 0 }, { kitId: "1" }, { kitId: 1, nuevoKitNombre: "Kit A" }]) {
    assert.equal(schema.safeParse({ ...base, ...extra }).success, false);
  }
  assert.equal(schema.parse({ ...base, nuevoKitNombre: " Kit A " }).nuevoKitNombre, "Kit A");
});

test("mes del reporte debe tener formato AAAA-MM", () => {
  for (const mes of ["2026-00", "2026-13", "2026-1", "0000-01", "", "2026-10-20"]) {
    assert.equal(mesComprasSchema.safeParse({ mes }).success, false);
  }
  assert.equal(mesComprasSchema.safeParse({ mes: "2026-12" }).success, true);
});
