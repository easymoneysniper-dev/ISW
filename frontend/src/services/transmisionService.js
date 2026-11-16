// Común · Llamadas a la API de transmisiones (M1). La usan M1 y los selectores de M2, M3 y M4.
import { pedir } from "./api";

const json = (metodo, datos) => ({ method: metodo, body: JSON.stringify(datos ?? {}) });

export async function listarTransmisiones(estado) {
  const datos = await pedir(`/transmisiones${estado ? `?estado=${estado}` : ""}`);
  if (!Array.isArray(datos)) throw new Error("El servidor devolvió una respuesta inesperada");
  return datos;
}

export const obtenerTransmision = (id) => pedir(`/transmisiones/${id}`);

export const obtenerCalendario = (mes) => pedir(`/transmisiones/calendario?mes=${mes}`);

export function consultarDisponibilidad({ inicio, termino, tiempoTrasladoMin }) {
  const parametros = new URLSearchParams({ inicio, termino, tiempoTrasladoMin: String(tiempoTrasladoMin ?? 0) });
  return pedir(`/transmisiones/disponibilidad?${parametros}`);
}

export const crearTransmision = (datos) => pedir("/transmisiones", json("POST", datos));

export const modificarRequerimientos = (id, cambios) => pedir(`/transmisiones/${id}/requerimientos`, json("PUT", cambios));

export const responderCotizacion = (id, respuesta) => pedir(`/transmisiones/${id}/respuesta`, json("PATCH", { respuesta }));

export const confirmarTransmision = (id) => pedir(`/transmisiones/${id}/confirmar`, json("PATCH"));

export const reprogramarTransmision = (id, horario) => pedir(`/transmisiones/${id}/reprogramar`, json("PATCH", horario));

export const cancelarTransmision = (id, datos) => pedir(`/transmisiones/${id}/cancelar`, json("PATCH", datos));
