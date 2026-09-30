// Hook para leer la sesión desde cualquier componente: const { usuario } = useSesion();
import { useContext } from "react";
import { SesionContext } from "../context/SesionContext";

export function useSesion() {
  const sesion = useContext(SesionContext);

  if (!sesion) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }

  return sesion;
}
