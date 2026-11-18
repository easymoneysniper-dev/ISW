// Muestra el estado de pago de una transmisión y la lista de pagos recibidos.
// Lo usa PagosPage.jsx, que le pasa el resumen que entrega el backend.
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import {
  formatearPesos,
  formatearFecha,
  NOMBRE_ESTADO_PAGO,
  NOMBRE_MEDIO_PAGO,
  TONO_ESTADO_PAGO,
} from "../formato";

export default function ResumenPagos({ resumen }) {
  return (
    <>
      <div className="ui-cifras">
        <div className="ui-cifra">
          <span>Estado de pago</span>
          <strong>
            <Badge tono={TONO_ESTADO_PAGO[resumen.estadoPago]}>{NOMBRE_ESTADO_PAGO[resumen.estadoPago]}</Badge>
          </strong>
        </div>
        <div className="ui-cifra">
          <span>Precio cotizado</span>
          <strong>{formatearPesos(resumen.precioCotizado)}</strong>
        </div>
        <div className="ui-cifra">
          <span>Total pagado</span>
          <strong>{formatearPesos(resumen.totalPagado)}</strong>
        </div>
        <div className="ui-cifra">
          <span>Saldo pendiente</span>
          <strong>{formatearPesos(resumen.saldoPendiente)}</strong>
        </div>
        {resumen.requiereAdelanto && (
          <div className="ui-cifra">
            <span>Adelanto mínimo</span>
            <strong>{formatearPesos(resumen.adelantoMinimo)}</strong>
          </div>
        )}
      </div>

      <h3 className="ui-subtitulo">Pagos recibidos</h3>
      <DataTable
        titulo="Pagos recibidos"
        datos={resumen.pagos}
        vacio="Todavía no hay pagos registrados."
        columnas={[
          { titulo: "Fecha", render: (pago) => formatearFecha(pago.fecha) },
          { titulo: "Tipo", render: (pago) => (pago.tipo === "ADELANTO" ? "Adelanto" : "Saldo") },
          { titulo: "Monto", numero: true, render: (pago) => formatearPesos(pago.monto) },
          { titulo: "Medio", render: (pago) => NOMBRE_MEDIO_PAGO[pago.medio] || "-" },
        ]}
      />
    </>
  );
}