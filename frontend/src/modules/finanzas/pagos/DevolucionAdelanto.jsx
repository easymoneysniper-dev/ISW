// Devolución del adelanto de una transmisión cancelada.
// Lo usa PagosPage.jsx cuando la transmisión elegida está Cancelada.
// El Contador registra la devolución; el Dueño solo la consulta.
import { useCallback, useEffect, useState } from "react";
import { obtenerDevolucion } from "../../../services/devolucionService";
import { formatearPesos, formatearFecha, NOMBRE_MEDIO_PAGO } from "../formato";
import RegistrarDevolucionForm from "./RegistrarDevolucionForm";

function DevolucionAdelanto({ transmisionId, puedeRegistrar, onError }) {
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(() => {
    obtenerDevolucion(transmisionId).then(setDatos).catch(onError);
  }, [transmisionId, onError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function devolucionRegistrada() {
    setMensaje("Devolución registrada correctamente");
    cargar();
  }

  if (!datos) return null;

  const { devolucion } = datos;

  return (
    <section>
      <h3>Devolución del adelanto</h3>

      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}

      {devolucion && (
        <p>
          Adelanto devuelto: <strong>{formatearPesos(devolucion.monto)}</strong> el{" "}
          {formatearFecha(devolucion.fecha)} por {NOMBRE_MEDIO_PAGO[devolucion.medio]}.
        </p>
      )}

      {!devolucion && datos.decisionAdelanto === "RETENER" && (
        <p>El Dueño decidió retener el adelanto: queda como ingreso del mes.</p>
      )}

      {!datos.decisionAdelanto && (
        <p>La transmisión se canceló sin adelanto que devolver.</p>
      )}

      {datos.marcadaParaDevolver && !datos.pagoAdelantoId && (
        <p>No hay un pago de adelanto registrado que devolver.</p>
      )}

      {datos.puedeRegistrar && !puedeRegistrar && (
        <p>Pendiente: el Contador todavía no registra la devolución.</p>
      )}

      {datos.puedeRegistrar && puedeRegistrar && (
        <RegistrarDevolucionForm
          transmisionId={transmisionId}
          montoSugerido={datos.totalPagado}
          onDevolucionRegistrada={devolucionRegistrada}
        />
      )}
    </section>
  );
}

export default DevolucionAdelanto;