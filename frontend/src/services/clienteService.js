// M1 · Llamadas a la API de clientes (RF 1.9–1.11).
import { pedir } from "./api";

const json = (metodo, datos) => ({ method: metodo, body: JSON.stringify(datos) });

export const listarClientes = (buscar = "") => pedir(`/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`);

export const crearCliente = (datos) => pedir("/clientes", json("POST", datos));

export const editarCliente = (id, cambios) => pedir(`/clientes/${id}`, json("PUT", cambios));

export const eliminarCliente = (id) => pedir(`/clientes/${id}`, { method: "DELETE" });
