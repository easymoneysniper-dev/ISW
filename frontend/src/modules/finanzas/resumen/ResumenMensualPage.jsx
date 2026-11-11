// Pantalla del resumen mensual (M4, requisito 4.7).
// El Dueño ve en grande si el mes tuvo ganancia o pérdida; el Contador además revisa
// las transmisiones del mes que todavía tienen saldo pendiente.
import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { obtenerResumenMensual } from "../../../services/reporteService";
import SelectorMes from "../SelectorMes";
import {
  formatearPesos,
  formatearFecha,
  periodoActual,
  NOMBRE_MES,
  NOMBRE_ESTADO_PAGO,
} from "../formato";

function ResumenMensualPage() {
  const { sesionExpirada } = useSesion();

  const [periodo, setPeriodo] = useState(periodoActual);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
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

  // Cada vez que cambia el mes o el año, pide el resumen de ese período.
  useEffect(() => {
    let activo = true;

    obtenerResumenMensual(periodo.anio, periodo.mes)
      .then((datos) => activo && setResumen(datos))
      .catch((err) => activo && manejarError(err))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [periodo, manejarError]);

  function cambiarPeriodo(nuevo) {
    setCargando(true);
    setError("");
    setPeriodo(nuevo);
  }

  const ganancia = resumen && resumen.resultadoNeto >= 0;

  return (
    <section>
      <h2>Resumen mensual</h2>

      <SelectorMes anio={periodo.anio} mes={periodo.mes} onCambiar={cambiarPeriodo} />

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {cargando && <p>Calculando el resumen...</p>}

      {resumen && !cargando && (
        <>
          <div
            style={{
              backgroundColor: ganancia ? "#dcfce7" : "#fee2e2",
              color: ganancia ? "#166534" : "#991b1b",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0 }}>
              {ganancia ? "Ganancia" : "Pérdida"} de {NOMBRE_MES[resumen.mes - 1]} {resumen.anio}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "2.5rem", fontWeight: "bold", lineHeight: 1.2 }}>
              {formatearPesos(Math.abs(resumen.resultadoNeto))}
            </p>
            {resumen.mesEnCurso && (
              <p style={{ margin: 0 }}>El mes todavía no termina: los valores pueden cambiar.</p>
            )}
          </div>

          <table>
            <tbody>
              <tr>
                <td>Pagos recibidos</td>
                <td>{formatearPesos(resumen.ingresos.pagos)}</td>
              </tr>
              <tr>
                <td>(incluye adelantos retenidos de transmisiones canceladas)</td>
                <td>{formatearPesos(resumen.ingresos.adelantosRetenidos)}</td>
              </tr>
              <tr>
                <td>− Devoluciones de adelantos</td>
                <td>{formatearPesos(resumen.ingresos.devoluciones)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Ingresos</strong>
                </td>
                <td>
                  <strong>{formatearPesos(resumen.ingresos.total)}</strong>
                </td>
              </tr>
              <tr>
                <td>+ Aportes cumplidos de auspiciadores</td>
                <td>{formatearPesos(resumen.aportesCumplidos)}</td>
              </tr>
              <tr>
                <td>− Comisiones liquidadas</td>
                <td>{formatearPesos(resumen.comisiones)}</td>
              </tr>
              <tr>
                <td>− Gastos de las transmisiones</td>
                <td>{formatearPesos(resumen.gastos)}</td>
              </tr>
              <tr>
                <td>− Pérdidas de equipos</td>
                <td>{formatearPesos(resumen.perdidasEquipos)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Rentabilidad de las transmisiones</strong>
                </td>
                <td>
                  <strong>{formatearPesos(resumen.rentabilidadTransmisiones)}</strong>
                </td>
              </tr>
              <tr>
                <td>− Compras de equipos</td>
                <td>{formatearPesos(resumen.comprasEquipos)}</td>
              </tr>
              <tr>
                <td>− Costos fijos</td>
                <td>{formatearPesos(resumen.costosFijos)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Resultado neto</strong>
                </td>
                <td>
                  <strong>{formatearPesos(resumen.resultadoNeto)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Pagos pendientes de las transmisiones del mes</h3>

          {resumen.pagosPendientes.length === 0 ? (
            <p>No hay transmisiones del mes con saldo pendiente.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Transmisión</th>
                  <th>Término</th>
                  <th>Saldo pendiente</th>
                  <th>Estado de pago</th>
                </tr>
              </thead>
              <tbody>
                {resumen.pagosPendientes.map((pendiente) => (
                  <tr key={pendiente.transmisionId}>
                    <td>{pendiente.nombreEvento}</td>
                    <td>{formatearFecha(pendiente.termino)}</td>
                    <td>{formatearPesos(pendiente.saldoPendiente)}</td>
                    <td>{NOMBRE_ESTADO_PAGO[pendiente.estadoPago]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

export default ResumenMensualPage;