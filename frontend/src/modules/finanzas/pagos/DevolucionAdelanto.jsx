// Devolución del adelanto de una transmisión cancelada.
// Lo usa PagosPage.jsx cuando la transmisión elegida está Cancelada.
// El Contador registra la devolución; el Dueño solo la consulta.
import { useCallback, useState } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { obtenerDevolucion } from "../../../services/devolucionService";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import { formatearPesos, formatearFecha, NOMBRE_MEDIO_PAGO } from "../formato";
import RegistrarDevolucionForm from "./RegistrarDevolucionForm";

export default function DevolucionAdelanto({ transmisionId, puedeRegistrar }) {
  const cargar = useCallback(() => obtenerDevolucion(transmisionId), [transmisionId]);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [mensaje, setMensaje] = useState("");

  function devolucionRegistrada() {
    setMensaje("Devolución registrada correctamente.");
    recargar();
  }

  const devolucion = datos?.devolucion;

  return (
    <Card titulo="Devolución del adelanto">
      <Alerta tipo="error">{error}</Alerta>
      <Alerta tipo="exito">{mensaje}</Alerta>
      {cargando && !datos && <p role="status">Cargando la devolución…</p>}

      {devolucion && (
        <p>
          Adelanto devuelto: <strong>{formatearPesos(devolucion.monto)}</strong> el{" "}
          {formatearFecha(devolucion.fecha)} por {NOMBRE_MEDIO_PAGO[devolucion.medio]}.
        </p>
      )}

      {datos && !devolucion && datos.decisionAdelanto === "RETENER" && (
        <Alerta tipo="info">El Dueño decidió retener el adelanto: queda como ingreso del mes.</Alerta>
      )}

      {datos && !datos.decisionAdelanto && (
        <Alerta tipo="info">La transmisión se canceló sin adelanto que devolver.</Alerta>
      )}

      {datos?.marcadaParaDevolver && !datos.pagoAdelantoId && (
        <Alerta tipo="advertencia">No hay un pago de adelanto registrado que devolver.</Alerta>
      )}

      {datos?.puedeRegistrar && !puedeRegistrar && (
        <Alerta tipo="advertencia">Pendiente: el Contador todavía no registra la devolución.</Alerta>
      )}

      {datos?.puedeRegistrar && puedeRegistrar && (
        <RegistrarDevolucionForm
          transmisionId={transmisionId}
          montoSugerido={datos.totalPagado}
          onDevolucionRegistrada={devolucionRegistrada}
        />
      )}
    </Card>
  );
}