// Pruebas unitarias del esquema de gastos (Clase 7). Se corren con: npm run test:run
import { describe, it, expect } from "vitest";
import { crearGastoSchema } from "../gasto.schema";

const pdf = [{ name: "boleta.pdf", type: "application/pdf", size: 1000 }];
const peaje = { categoria: "PEAJE", monto: "3200", fecha: "2026-11-01", comprobante: pdf };
const viaje = { ...peaje, categoria: "MOVILIZACION", origen: "Concepción", destino: "Chillán" };

// Devuelve el mensaje de error de un campo, o undefined si no hay error.
function mensajeDe(datos, campo) {
  const resultado = crearGastoSchema.safeParse(datos);
  return resultado.error?.issues.find((issue) => issue.path.includes(campo))?.message;
}

describe("Pruebas unitarias: crearGastoSchema (Zod)", () => {
  it("acepta un peaje sin origen ni destino", () => {
    expect(crearGastoSchema.safeParse(peaje).success).toBe(true);
  });

  it("acepta una movilización con origen y destino", () => {
    expect(crearGastoSchema.safeParse(viaje).success).toBe(true);
  });

  it("exige el origen en la movilización", () => {
    expect(mensajeDe({ ...viaje, origen: "" }, "origen")).toBe(
      "En la movilización debes indicar el origen"
    );
  });

  it("exige el destino en la movilización", () => {
    expect(mensajeDe({ ...viaje, destino: "" }, "destino")).toBe(
      "En la movilización debes indicar el destino"
    );
  });

  it("exige elegir la categoría", () => {
    expect(mensajeDe({ ...peaje, categoria: "" }, "categoria")).toBe("Elige la categoría del gasto");
  });

  it("rechaza un monto de 0", () => {
    expect(mensajeDe({ ...peaje, monto: "0" }, "monto")).toBe("El monto debe ser mayor a 0");
  });

  it("exige el comprobante", () => {
    expect(mensajeDe({ ...peaje, comprobante: [] }, "comprobante")).toBe(
      "Debes adjuntar el comprobante"
    );
  });
});
