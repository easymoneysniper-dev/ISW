// Común · Formatos de pantalla: pesos chilenos y fechas en hora de Chile.
const formatoPesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const formatoFechaHora = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "medium", timeStyle: "short" });
const formatoFecha = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "medium" });

export const pesos = (valor) => formatoPesos.format(Number(valor ?? 0));

export const fechaHora = (valor) => (valor ? formatoFechaHora.format(new Date(valor)) : "—");

export const fecha = (valor) => (valor ? formatoFecha.format(new Date(valor)) : "—");

// Fechas sin hora de la BD: se muestran tal cual, sin cambiar de día.
export const fechaDia = (valor) => (valor ? valor.slice(0, 10).split("-").reverse().join("/") : "—");

export function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}
