// Pantalla de costos fijos del mes (M4, requisito 4.3).
// El Contador elige mes y año, agrega costos fijos y elimina los que ingresó por error.
// El Dueño ve la lista y el total, sin el formulario ni los botones.
import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { listarCostosFijos, eliminarCostoFijo } from "../../../services/costoFijoService";
import SelectorMes from "../SelectorMes";
import RegistrarCostoFijoForm from "./RegistrarCostoFijoForm";
import { formatearPesos, periodoActual } from "../formato";

// Solo el Contador registra y elimina costos fijos (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

function CostosFijosPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);

  const [periodo, setPeriodo] = useState(periodoActual);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Si la sesión venció vuelve al login; si no, muestra el mensaje del backend.
  const manejarError = useCallback(
    (err) => {
      if (err.status === 401) {
        sesionExpirada();
        return;
      }
      setError(err.message);
    },
    [sesionExpirada]
  );

  // Cada vez que cambia el mes o el año, pide los costos de ese período.
  useEffect(() => {
    let activo = true;

    listarCostosFijos(periodo.anio, periodo.mes)
      .then((datos) => activo && setResultado(datos))
      .catch((err) => activo && manejarError(err))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [periodo, manejarError]);

  function cambiarPeriodo(nuevo) {
    setCargando(true);
    setError("");
    setMensaje("");
    setPeriodo(nuevo);
  }

  async function recargar(texto) {
    setMensaje(texto);
    setError("");

    try {
      setResultado(await listarCostosFijos(periodo.anio, periodo.mes));
    } catch (err) {
      manejarError(err);
    }
  }

  async function eliminar(costo) {
    if (!window.confirm(`¿Eliminar "${costo.nombre}"?`)) return;

    try {
      await eliminarCostoFijo(costo.id);
      await recargar("Costo fijo eliminado");
    } catch (err) {
      manejarError(err);
    }
  }

  return (
    <section>
      <h2>Costos fijos del mes</h2>

      <SelectorMes anio={periodo.anio} mes={periodo.mes} onCambiar={cambiarPeriodo} />

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}
      {cargando && <p>Cargando costos fijos...</p>}

      {resultado && !cargando && (
        <>
          <p>
            <strong>Total del mes: {formatearPesos(resultado.total)}</strong>
          </p>

          {resultado.costos.length === 0 ? (
            <p>Todavía no hay costos fijos en este mes.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Monto</th>
                  {puedeRegistrar && <th></th>}
                </tr>
              </thead>
              <tbody>
                {resultado.costos.map((costo) => (
                  <tr key={costo.id}>
                    <td>{costo.nombre}</td>
                    <td>{formatearPesos(costo.monto)}</td>
                    {puedeRegistrar && (
                      <td>
                        <button type="button" onClick={() => eliminar(costo)}>
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {puedeRegistrar && (
            <RegistrarCostoFijoForm
              key={`${periodo.anio}-${periodo.mes}`}
              anio={periodo.anio}
              mes={periodo.mes}
              onCostoRegistrado={() => recargar("Costo fijo agregado")}
            />
          )}
        </>
      )}
    </section>
  );
}

export default CostosFijosPage;