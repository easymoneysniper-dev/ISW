// Llamadas a la API de gastos y rendición (M4, requisito 4.2).
// Lo usa modules/finanzas/gastos/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

// Gastos de una transmisión, su total y si la rendición ya está completa.
export function obtenerGastos(transmisionId) {
  return pedir(`/gastos/transmision/${transmisionId}`);
}

// Registra un gasto con su comprobante. Se envía como FormData porque lleva un archivo.
export function registrarGasto(transmisionId, datos) {
  const formData = new FormData();
  formData.append("transmisionId", transmisionId);
  formData.append("categoria", datos.categoria);
  formData.append("monto", datos.monto);
  formData.append("fecha", datos.fecha);
  if (datos.observacion) formData.append("observacion", datos.observacion);
  if (datos.origen) formData.append("origen", datos.origen);
  if (datos.destino) formData.append("destino", datos.destino);
  formData.append("comprobante", datos.comprobante[0]);

  return pedir("/gastos", { method: "POST", body: formData });
}

// Marca que ya se recibieron todos los gastos de la transmisión.
export function completarRendicion(transmisionId) {
  return pedir(`/gastos/transmision/${transmisionId}/rendicion`, { method: "POST" });
}
