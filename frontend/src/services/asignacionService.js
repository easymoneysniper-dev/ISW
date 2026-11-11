// Llamadas a la API para asignación, comisiones, reemplazos, retiros y asistencia (RF-12 a RF-16).
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

export function retirarAsignacion(asignacionId, motivo) {
  return pedir(`/asignaciones/${asignacionId}/retirar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export function registrarAsistencia(asignacionId, asistencia) {
  return pedir(`/asignaciones/${asignacionId}/asistencia`, {
    method: "PATCH",
    body: JSON.stringify({ asistencia }),
  });
}

export function registrarCamarasUtilizadas(transmisionId, camarasUtilizadas) {
  return pedir(`/asignaciones/transmision/${transmisionId}/camaras`, {
    method: "PATCH",
    body: JSON.stringify({ camarasUtilizadas }),
  });
}