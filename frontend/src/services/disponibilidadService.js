// Llamadas a la API de disponibilidad de trabajadores (RF-11).
import { pedir } from "./api";

export async function listarDisponibilidades(trabajadorId) {
  const query = trabajadorId ? `?trabajadorId=${trabajadorId}` : "";
  const datos = await pedir(`/disponibilidades${query}`);

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió una respuesta inesperada");
  }

  return datos;
}

export function crearDisponibilidad(datos) {
  return pedir("/disponibilidades", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarDisponibilidad(id, datos) {
  return pedir(`/disponibilidades/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export function eliminarDisponibilidad(id) {
  return pedir(`/disponibilidades/${id}`, {
    method: "DELETE",
  });
}