// Ficha de rentabilidad de una transmisión.
// La usa ResumenMensualPage.jsx, debajo del resumen del mes. Dueño y Contador la consultan.
// El backend solo la entrega si la transmisión está Rendida o Cerrada; si no, se muestra su mensaje.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { obtenerRentabilidad } from "../../../services/reporteService";
import SelectorTransmision from "../SelectorTransmision";
import { formatearPesos } from "../formato";

function FichaRentabilidad() {
  const { sesionExpirada } = useSesion();

  const [transmision, setTransmision] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

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

  async function elegirTransmision(elegida) {
    setTransmision(elegida);
    setFicha(null);
    setError("");
    if (!elegida) return;

    setCargando(true);
    try {
      setFicha(await obtenerRentabilidad(elegida.id));
    } catch (err) {
      manejarError(err);
    } finally {
      setCargando(false);
    }
  }

  const ganancia = ficha && ficha.rentabilidad >= 0;

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Rentabilidad por transmisión</h2>
      <p>Solo se puede revisar cuando la transmisión está Rendida o Cerrada.</p>

      <SelectorTransmision
        transmision={transmision}
        onCambiar={elegirTransmision}
        onError={manejarError}
      />

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {cargando && <p>Calculando la rentabilidad...</p>}

      {ficha && !cargando && (
        <>
          <h3>{ficha.nombreEvento}</h3>

          <table>
            <tbody>
              <tr>
                <td>Pagos recibidos (menos devoluciones)</td>
                <td>{formatearPesos(ficha.ingresos)}</td>
              </tr>
              <tr>
                <td>+ Aportes cumplidos de auspiciadores</td>
                <td>{formatearPesos(ficha.aportesCumplidos)}</td>
              </tr>
              <tr>
                <td>− Comisiones liquidadas</td>
                <td>{formatearPesos(ficha.comisiones)}</td>
              </tr>
              <tr>
                <td>− Gastos</td>
                <td>{formatearPesos(ficha.gastos)}</td>
              </tr>
              <tr>
                <td>− Pérdidas de equipos</td>
                <td>{formatearPesos(ficha.perdidasEquipos)}</td>
              </tr>
              <tr style={{ color: ganancia ? "#166534" : "#991b1b" }}>
                <td>
                  <strong>Rentabilidad</strong>
                </td>
                <td>
                  <strong>{formatearPesos(ficha.rentabilidad)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default FichaRentabilidad;