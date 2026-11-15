// Común · Ejecuta una acción que guarda datos (crear, confirmar, cancelar…) y maneja "guardando" y el error.
// Si la sesión venció (401), vuelve al login.
import { useCallback, useState } from "react";
import { useSesion } from "./useSesion";

export function useAccion() {
  const { sesionExpirada } = useSesion();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const ejecutar = useCallback(async (accion) => {
    setGuardando(true);
    setError("");
    try {
      return await accion();
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
      return null;
    } finally {
      setGuardando(false);
    }
  }, [sesionExpirada]);

  return { ejecutar, guardando, error, limpiarError: () => setError("") };
}
