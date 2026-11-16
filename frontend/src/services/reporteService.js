import { pedir } from "./api";

// Ingresos, gastos, costos fijos y resultado neto del mes.
export function obtenerResumenMensual(anio, mes) {
  return pedir(`/reportes/resumen-mensual?anio=${anio}&mes=${mes}`);
}

// Ficha de rentabilidad de una transmisión Rendida o Cerrada.
export function obtenerRentabilidad(transmisionId) {
  return pedir(`/reportes/transmision/${transmisionId}/rentabilidad`);
}