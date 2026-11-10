// Muestra los gastos de una transmisión, su total y si la rendición está completa.
// Lo usa GastosPage.jsx, que le pasa lo que entrega el backend.
import { formatearPesos, formatearFecha, NOMBRE_CATEGORIA_GASTO } from "../formato";

function ListaGastos({ resultado }) {
  return (
    <section>
      <p>
        Rendición:{" "}
        {resultado.rendicionCompleta ? (
          <strong style={{ color: "#166534" }}>
            Completa (desde el {formatearFecha(resultado.fechaRendicion)})
          </strong>
        ) : (
          <strong style={{ color: "#854d0e" }}>Pendiente</strong>
        )}
      </p>

      <p>
        <strong>Total de gastos: {formatearPesos(resultado.totalGastos)}</strong>
      </p>

      {resultado.gastos.length === 0 ? (
        <p>Todavía no hay gastos registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Origen → destino</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {resultado.gastos.map((gasto) => (
              <tr key={gasto.id}>
                <td>{formatearFecha(gasto.fecha)}</td>
                <td>{NOMBRE_CATEGORIA_GASTO[gasto.categoria]}</td>
                <td>{formatearPesos(gasto.monto)}</td>
                <td>{gasto.origen ? `${gasto.origen} → ${gasto.destino}` : "-"}</td>
                <td>{gasto.observacion || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ListaGastos;