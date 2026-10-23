import { pedir } from "./api";

export const listarEquipos = () => pedir("/equipos");
export const listarKits = () => pedir("/equipos/kits");
export const obtenerCompras = (mes) => pedir(`/equipos/compras-mensuales?mes=${encodeURIComponent(mes)}`);
export function guardarEquipo(datos, id) {
  return pedir(id ? `/equipos/${id}` : "/equipos", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
}
