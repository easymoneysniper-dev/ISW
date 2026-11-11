// Pruebas unitarias del esquema de costos fijos (Clase 7). Se corren con: npm run test:run
import { describe, it, expect } from "vitest";
import { crearCostoFijoSchema } from "../costoFijo.schema";

const arriendo = { nombre: "Arriendo oficina", monto: "350000" };

// Devuelve el mensaje de error de un campo, o undefined si no hay error.
function mensajeDe(datos, campo) {
  const resultado = crearCostoFijoSchema.safeParse(datos);
  return resultado.error?.issues.find((issue) => issue.path.includes(campo))?.message;
}

describe("Pruebas unitarias: crearCostoFijoSchema (Zod)", () => {
  it("acepta un costo fijo con nombre y monto", () => {
    expect(crearCostoFijoSchema.safeParse(arriendo).success).toBe(true);
  });

  it("exige un nombre de al menos 2 caracteres", () => {
    expect(mensajeDe({ ...arriendo, nombre: " A " }, "nombre")).toBe(
      "El nombre debe tener al menos 2 caracteres"
    );
  });

  it("rechaza un monto de 0", () => {
    expect(mensajeDe({ ...arriendo, monto: "0" }, "monto")).toBe("El monto debe ser mayor a 0");
  });
});