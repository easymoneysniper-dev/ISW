// Llamadas a la API de pagos del cliente (M4, requisito 4.1).
// Lo usa modules/finanzas/pagos/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

// Resumen de pagos de una transmisión: precio, total pagado, saldo, estado de pago y lista de pagos.
export function obtenerResumenPagos(transmisionId) {
  return pedir(`/pagos/transmision/${transmisionId}`);
}

// Registra un pago con su comprobante. Se envía como FormData porque lleva un archivo.
export function registrarPago(transmisionId, datos) {
  const formData = new FormData();
  formData.append("transmisionId", transmisionId);
  formData.append("tipo", datos.tipo);
  formData.append("monto", datos.monto);
  formData.append("fecha", datos.fecha);
  formData.append("medio", datos.medio);
  formData.append("comprobante", datos.comprobante[0]);

  return pedir("/pagos", { method: "POST", body: formData });
}