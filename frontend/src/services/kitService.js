// M3 · Llamadas a /api/kits.
import { pedir } from "./api";

export const listarKits = () => pedir("/kits");

export function guardarKit(datos, id) {
  return pedir(id ? `/kits/${id}` : "/kits", { method: id ? "PUT" : "POST", body: JSON.stringify(datos) });
}

export const kitsDeTransmision = (transmisionId) => pedir(`/kits/transmision/${transmisionId}`);

export function asignarKit(transmisionId, kitId, aceptarAdvertencia = false) {
  return pedir(`/kits/transmision/${transmisionId}`, {
    method: "POST",
    body: JSON.stringify({ kitId, aceptarAdvertencia }),
  });
}

export const retirarKit = (transmisionId, kitId) =>
  pedir(`/kits/transmision/${transmisionId}/${kitId}`, { method: "DELETE" });
