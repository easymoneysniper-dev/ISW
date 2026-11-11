// Llamadas a la API de costos fijos (M4, requisito 4.3).
// Lo usa modules/finanzas/costos/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

// Costos fijos de un mes y su total.
export function listarCostosFijos(anio, mes) {
  return pedir(`/costos-fijos?anio=${anio}&mes=${mes}`);
}

export function registrarCostoFijo(datos) {
  return pedir("/costos-fijos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function eliminarCostoFijo(id) {
  return pedir(`/costos-fijos/${id}`, { method: "DELETE" });
}
