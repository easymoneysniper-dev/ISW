// Pruebas unitarias de los esquemas de auspiciadores y aportes. Se corren con: npm run test:run
import { describe, it, expect } from "vitest";
import { crearAcuerdoSchema, recepcionSchema, noCumplidoSchema } from "../auspiciador.schema";
import { fechaDeHoy } from "../comprobante.schema";

const pdf = [{ name: "acta.pdf", type: "application/pdf", size: 1000 }];
const acuerdoValido = {
  auspiciadorId: "1",
  transmisionId: "2",
  tipo: "DINERO",
  descripcion: "Aporte en dinero para la transmisión",
  valorPesos: "50000",
  fechaComprometida: fechaDeHoy(),
};

// Devuelve el mensaje de error de un campo, o undefined si no hay error.
function mensajeDe(schema, datos, campo) {
  const resultado = schema.safeParse(datos);
  return resultado.error?.issues.find((issue) => issue.path.includes(campo))?.message;
}

describe("Pruebas unitarias: auspiciadores y aportes (Zod)", () => {
  it("acepta un acuerdo en dinero con fecha de hoy", () => {
    expect(crearAcuerdoSchema.safeParse(acuerdoValido).success).toBe(true);
  });

  it("exige el monto si el aporte es en dinero", () => {
    expect(mensajeDe(crearAcuerdoSchema, { ...acuerdoValido, valorPesos: "" }, "valorPesos")).toBe(
      "Indica el monto comprometido en pesos",
    );
  });

  it("acepta un canje sin valor en pesos", () => {
    expect(
      crearAcuerdoSchema.safeParse({ ...acuerdoValido, tipo: "CANJE", valorPesos: "" }).success,
    ).toBe(true);
  });

  it("rechaza una fecha comprometida anterior a hoy", () => {
    expect(
      mensajeDe(crearAcuerdoSchema, { ...acuerdoValido, fechaComprometida: "2020-01-01" }, "fechaComprometida"),
    ).toBe("La fecha comprometida no puede ser anterior a hoy");
  });

  it("exige el valor en pesos al recibir un canje", () => {
    const recepcion = { fechaRecepcion: fechaDeHoy(), valorPesos: "", comprobante: pdf };
    expect(mensajeDe(recepcionSchema("CANJE"), recepcion, "valorPesos")).toBe(
      "Indica el valor en pesos del canje",
    );
    expect(recepcionSchema("DINERO").safeParse(recepcion).success).toBe(true);
  });

  it("exige una observación al marcar No cumplido", () => {
    expect(mensajeDe(noCumplidoSchema, { observacion: "no" }, "observacion")).toBe(
      "Explica en la observación por qué no se cumplió (al menos 5 caracteres)",
    );
  });
});