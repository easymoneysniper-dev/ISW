// M3 · Llamadas a /api/movimientos.
import { pedir } from "./api";

export const movimientosDeTransmision = (transmisionId) => pedir(`/movimientos/transmision/${transmisionId}`);

export const registrarSalidas = (transmisionId, salidas) =>
  pedir("/movimientos/salidas", { method: "POST", body: JSON.stringify({ transmisionId, salidas }) });

export const registrarRetorno = (salidaId, estadoRetorno) =>
  pedir(`/movimientos/salidas/${salidaId}/retorno`, { method: "PATCH", body: JSON.stringify({ estadoRetorno }) });

export const registrarIncidente = (salidaId, tipo, observacion) =>
  pedir(`/movimientos/salidas/${salidaId}/incidente`, { method: "POST", body: JSON.stringify({ tipo, observacion }) });
