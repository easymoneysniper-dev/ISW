// Llamadas a la API para asignación, comisiones y reemplazos (RF-12, RF-13 y RF-14).
import { pedir } from "./api";

export function obtenerContextoAsignacion(transmisionId, tiempoTrasladoMin) {
  const query =
    tiempoTrasladoMin !== undefined && tiempoTrasladoMin !== ""
      ? `?tiempoTrasladoMin=${encodeURIComponent(tiempoTrasladoMin)}`
      : "";
  return pedir(`/asignaciones/transmision/${transmisionId}${query}`);
}

export function crearAsignacion(datos) {
  return pedir("/asignaciones", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function definirComision(asignacionId, porcentajeComision) {
  return pedir(`/asignaciones/${asignacionId}/comision`, {
    method: "PATCH",
    body: JSON.stringify({ porcentajeComision }),
  });
}

export function reemplazarAsignacion(asignacionId, datos) {
  return pedir(`/asignaciones/${asignacionId}/reemplazar`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}