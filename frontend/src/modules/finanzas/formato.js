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

export const COLOR_ESTADO_PAGO = {
  PENDIENTE: { fondo: "#fef9c3", texto: "#854d0e" },
  ADELANTO_PAGADO: { fondo: "#dbeafe", texto: "#1e40af" },
  PAGADO: { fondo: "#dcfce7", texto: "#166534" },
  ATRASADO: { fondo: "#fee2e2", texto: "#991b1b" },
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

// Estilos comunes de los formularios de Finanzas.
export const ESTILO_CAMPO = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  maxWidth: "360px",
  marginBottom: "0.75rem",
};

export const ESTILO_ERROR = { color: "#b91c1c", margin: 0 };
