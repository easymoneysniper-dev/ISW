// Funciones para mostrar montos, fechas y estados en las pantallas de Finanzas.

const pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

export function formatearPesos(monto) {
  return pesos.format(monto);
}

// Las fechas de pagos y gastos se guardan a medianoche UTC; se muestran en UTC para no correr un día.
export function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", { timeZone: "UTC" });
}

export const NOMBRE_ESTADO_PAGO = {
  PENDIENTE: "Pendiente",
  ADELANTO_PAGADO: "Adelanto pagado",
  PAGADO: "Pagado",
  ATRASADO: "Atrasado",
};

// Tono de la insignia de cada estado de pago.
export const TONO_ESTADO_PAGO = {
  PENDIENTE: "advertencia",
  ADELANTO_PAGADO: "info",
  PAGADO: "exito",
  ATRASADO: "error",
};

export const NOMBRE_MEDIO_PAGO = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
};

export const NOMBRE_CATEGORIA_GASTO = {
  MOVILIZACION: "Movilización",
  PEAJE: "Peaje",
  ALIMENTACION: "Alimentación",
  OTRO: "Otro",
};

export const NOMBRE_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Mes y año de hoy, para que las pantallas partan en el mes actual.
export function periodoActual() {
  const hoy = new Date();
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

// Auspiciadores y aportes. "Atrasado" lo calcula el backend.
export const NOMBRE_TIPO_APORTE = {
  DINERO: "Dinero",
  CANJE: "Canje",
};

export const NOMBRE_ESTADO_APORTE = {
  COMPROMETIDO: "Comprometido",
  ATRASADO: "Atrasado",
  CUMPLIDO: "Cumplido",
  NO_CUMPLIDO: "No cumplido",
};

// Tono de la insignia de cada estado de un aporte.
export const TONO_ESTADO_APORTE = {
  COMPROMETIDO: "info",
  ATRASADO: "error",
  CUMPLIDO: "exito",
  NO_CUMPLIDO: "neutro",
};