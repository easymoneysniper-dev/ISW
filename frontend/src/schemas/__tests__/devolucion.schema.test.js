// Pruebas unitarias del esquema de la devolución del adelanto. Se corren con: npm run test:run
import { describe, it, expect } from "vitest";
import { crearDevolucionSchema } from "../devolucion.schema";

const pdf = [{ name: "comprobante.pdf", type: "application/pdf", size: 1000 }];
const devolucionValida = {
  monto: "100000",
  fecha: "2026-11-10",
  medio: "TRANSFERENCIA",
  comprobante: pdf,
};

// Devuelve el mensaje de error de un campo, o undefined si no hay error.
function mensajeDe(datos, campo) {
  const resultado = crearDevolucionSchema.safeParse(datos);
  return resultado.error?.issues.find((issue) => issue.path.includes(campo))?.message;
}

describe("Pruebas unitarias: crearDevolucionSchema (Zod)", () => {
  it("acepta una devolución con todos los datos correctos", () => {
    expect(crearDevolucionSchema.safeParse(devolucionValida).success).toBe(true);
  });

  it("rechaza un monto de 0", () => {
    expect(mensajeDe({ ...devolucionValida, monto: "0" }, "monto")).toBe("El monto debe ser mayor a 0");
  });

  it("rechaza una fecha futura", () => {
    expect(mensajeDe({ ...devolucionValida, fecha: "2099-01-01" }, "fecha")).toBe(
      "La fecha de la devolución no puede ser futura",
    );
  });

  it("exige el comprobante", () => {
    expect(mensajeDe({ ...devolucionValida, comprobante: [] }, "comprobante")).toBe(
      "Debes adjuntar el comprobante",
    );
  });
});