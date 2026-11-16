// Llamadas a la API de la devolución del adelanto.
// Lo usa modules/finanzas/pagos/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

// Lo pagado, la decisión del adelanto, la devolución (o null) y si todavía se puede registrar.
export function obtenerDevolucion(transmisionId) {
  return pedir(`/devoluciones/transmision/${transmisionId}`);
}

// Registra la devolución con su comprobante. Se envía como FormData porque lleva un archivo.
export function registrarDevolucion(transmisionId, datos) {
  const formData = new FormData();
  formData.append("transmisionId", transmisionId);
  formData.append("monto", datos.monto);
  formData.append("fecha", datos.fecha);
  formData.append("medio", datos.medio);
  formData.append("comprobante", datos.comprobante[0]);

  return pedir("/devoluciones", { method: "POST", body: formData });
}