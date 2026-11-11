// Común · Carga datos al abrir una pantalla. Si la sesión venció (401), vuelve al login.
// "cargar" debe ser estable (definida fuera del componente o con useCallback).
import { useCallback, useEffect, useState } from "react";
import { useSesion } from "./useSesion";

export function useFetch(cargar) {
  const { sesionExpirada } = useSesion();
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: "" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    cargar()
      .then((datos) => { if (activo) setEstado({ datos, cargando: false, error: "" }); })
      .catch((err) => {
        if (!activo) return;
        if (err.status === 401) sesionExpirada();
        else setEstado({ datos: null, cargando: false, error: err.message });
      });
    return () => { activo = false; };
  }, [cargar, version, sesionExpirada]);

  const recargar = useCallback(() => {
    setEstado((anterior) => ({ ...anterior, cargando: true, error: "" }));
    setVersion((v) => v + 1);
  }, []);

  return { ...estado, recargar };
}
