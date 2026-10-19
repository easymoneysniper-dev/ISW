// Llamadas a la API de trabajadores (RF-10).
// Lo usan las pantallas de pages/personal/ y habla con el backend a través de services/api.js.
import { pedir } from "./api";

export async function listarTrabajadores() {
  const datos = await pedir("/trabajadores");

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió una respuesta inesperada");
  }

  return datos;
}

export function obtenerTrabajador(id) {
  return pedir(`/trabajadores/${id}`);
}

export function crearTrabajador(datos) {
  return pedir("/trabajadores", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarTrabajador(id, datos) {
  return pedir(`/trabajadores/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}
