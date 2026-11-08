// Muestra el estado de pago de una transmisión y la lista de pagos recibidos.
// Lo usa PagosPage.jsx, que le pasa el resumen que entrega el backend.
import {
  formatearPesos,
  formatearFecha,
  NOMBRE_ESTADO_PAGO,
  NOMBRE_MEDIO_PAGO,
  COLOR_ESTADO_PAGO,
} from "../formato";

function ResumenPagos({ resumen }) {
  const color = COLOR_ESTADO_PAGO[resumen.estadoPago];

  return (
    <section>
      <p>
        Estado de pago:{" "}
        <strong
          style={{
            backgroundColor: color.fondo,
            color: color.texto,
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
          }}
        >
          {NOMBRE_ESTADO_PAGO[resumen.estadoPago]}
        </strong>
      </p>

      <ul>
        <li>Precio cotizado: {formatearPesos(resumen.precioCotizado)}</li>
        <li>Total pagado: {formatearPesos(resumen.totalPagado)}</li>
        <li>
          <strong>Saldo pendiente: {formatearPesos(resumen.saldoPendiente)}</strong>
        </li>
        {resumen.requiereAdelanto && (
          <li>Requiere adelanto de al menos {formatearPesos(resumen.adelantoMinimo)}</li>
        )}
      </ul>

      <h3>Pagos recibidos</h3>

      {resumen.pagos.length === 0 ? (
        <p>Todavía no hay pagos registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Medio</th>
            </tr>
          </thead>
          <tbody>
            {resumen.pagos.map((pago) => (
              <tr key={pago.id}>
                <td>{formatearFecha(pago.fecha)}</td>
                <td>{pago.tipo === "ADELANTO" ? "Adelanto" : "Saldo"}</td>
                <td>{formatearPesos(pago.monto)}</td>
                <td>{NOMBRE_MEDIO_PAGO[pago.medio] || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ResumenPagos;
