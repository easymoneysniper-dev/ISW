export const estadosEquipo = {
  DISPONIBLE: "Disponible",
  DANADO: "Dañado",
  EN_REPARACION: "En reparación",
  PERDIDO: "Perdido",
  DADO_DE_BAJA: "Dado de baja",
};

export const pesos = (valor) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(valor));

// Una fecha de compra no tiene hora: se muestra sin cambiar de día por zona horaria.
export const fecha = (valor) => valor.slice(0, 10).split("-").reverse().join("/");
export function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}
