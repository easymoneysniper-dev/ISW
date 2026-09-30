// Llamadas a la API de transmisiones. Lo usa TransmisionesPage.jsx.
import { pedir } from "./api";

export async function listarTransmisiones() {
  const datos = await pedir("/transmisiones");

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió una respuesta inesperada");
  }

  return datos;
}
