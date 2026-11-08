// Pruebas unitarias del esquema de pagos (Clase 7). Se corren con: npm run test:run
import { describe, it, expect } from "vitest";
import { crearPagoSchema } from "../pago.schema";

const pdf = [{ name: "comprobante.pdf", type: "application/pdf", size: 1000 }];
const pagoValido = {
  tipo: "ADELANTO",
  monto: "100000",
  fecha: "2026-11-06",
  medio: "TRANSFERENCIA",
  comprobante: pdf,
};

// Devuelve el mensaje de error de un campo, o undefined si no hay error.
function mensajeDe(datos, campo) {
  const resultado = crearPagoSchema.safeParse(datos);
  return resultado.error?.issues.find((issue) => issue.path.includes(campo))?.message;
}

describe("Pruebas unitarias: crearPagoSchema (Zod)", () => {
  it("acepta un pago con todos los datos correctos", () => {
    expect(crearPagoSchema.safeParse(pagoValido).success).toBe(true);
  });

  it("exige el medio de pago", () => {
    expect(mensajeDe({ ...pagoValido, medio: "" }, "medio")).toBe("Elige el medio de pago");
  });

  it("rechaza una fecha futura", () => {
    expect(mensajeDe({ ...pagoValido, fecha: "2099-01-01" }, "fecha")).toBe(
      "La fecha de recepción no puede ser futura",
    );
  });

  it("rechaza un monto de 0", () => {
    expect(mensajeDe({ ...pagoValido, monto: "0" }, "monto")).toBe("El monto debe ser mayor a 0");
  });

  it("rechaza un monto con decimales", () => {
    expect(mensajeDe({ ...pagoValido, monto: "1000.5" }, "monto")).toBe(
      "El monto va en pesos, sin decimales",
    );
  });

  it("exige el comprobante", () => {
    expect(mensajeDe({ ...pagoValido, comprobante: [] }, "comprobante")).toBe(
      "Debes adjuntar el comprobante",
    );
  });

  it("rechaza un comprobante que no es JPG, PNG ni PDF", () => {
    const word = [{ name: "a.docx", type: "application/msword", size: 1000 }];
    expect(mensajeDe({ ...pagoValido, comprobante: word }, "comprobante")).toBe(
      "El comprobante debe ser JPG, PNG o PDF",
    );
  });

  it("rechaza un comprobante de más de 5 MB", () => {
    const grande = [{ name: "a.pdf", type: "application/pdf", size: 6 * 1024 * 1024 }];
    expect(mensajeDe({ ...pagoValido, comprobante: grande }, "comprobante")).toBe(
      "El comprobante no puede pesar más de 5 MB",
    );
  });
});
