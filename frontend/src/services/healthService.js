// Comprueba que el backend responde. Lo usa TransmisionesPage.jsx.
import { pedir } from "./api";

export async function comprobarBackend() {
  const datos = await pedir("/health");
  return datos.message;
}
