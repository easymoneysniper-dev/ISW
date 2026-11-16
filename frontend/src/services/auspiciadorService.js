// Llamadas a la API de auspiciadores y aportes.
// Lo usa modules/finanzas/auspiciadores/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

export function listarAuspiciadores() {
  return pedir("/auspiciadores");
}

export function registrarAuspiciador(datos) {
  return pedir("/auspiciadores", { method: "POST", body: JSON.stringify(datos) });
}

// Todos los acuerdos con su auspiciador, transmisión y estado (Atrasado ya viene calculado).
export function listarAportes() {
  return pedir("/aportes");
}

// Acuerdo con un auspiciador: queda Comprometido.
export function registrarAcuerdo(datos) {
  return pedir("/aportes", { method: "POST", body: JSON.stringify(datos) });
}

// Recepción del aporte con su comprobante. Se envía como FormData porque lleva un archivo.
export function registrarRecepcion(aporteId, datos) {
  const formData = new FormData();
  formData.append("fechaRecepcion", datos.fechaRecepcion);
  if (datos.valorPesos) formData.append("valorPesos", datos.valorPesos);
  formData.append("comprobante", datos.comprobante[0]);

  return pedir(`/aportes/${aporteId}/recepcion`, { method: "PATCH", body: formData });
}

// El Dueño marca el aporte como No cumplido con una observación.
export function marcarNoCumplido(aporteId, observacion) {
  return pedir(`/aportes/${aporteId}/no-cumplido`, {
    method: "PATCH",
    body: JSON.stringify({ observacion }),
  });
}