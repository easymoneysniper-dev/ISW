// Llamadas a la API para asignación de trabajadores y comisiones (RF-12 y RF-13).
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