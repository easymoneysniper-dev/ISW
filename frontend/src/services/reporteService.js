// Llamadas a la API de reportes del M4 (requisitos 4.6 y 4.7).
// Lo usa modules/finanzas/resumen/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

// Ingresos, gastos, costos fijos y resultado neto del mes.
export function obtenerResumenMensual(anio, mes) {
  return pedir(`/reportes/resumen-mensual?anio=${anio}&mes=${mes}`);
}