// Muestra los gastos de una transmisión, su total y si la rendición está completa.
// Lo usa GastosPage.jsx, que le pasa lo que entrega el backend.
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { formatearPesos, formatearFecha, NOMBRE_CATEGORIA_GASTO } from "../formato";

export default function ListaGastos({ resultado }) {
  return (
    <>
      <div className="ui-cifras">
        <div className="ui-cifra">
          <span>Rendición</span>
          <strong>
            {resultado.rendicionCompleta ? (
              <Badge tono="exito">Completa desde el {formatearFecha(resultado.fechaRendicion)}</Badge>
            ) : (
              <Badge tono="advertencia">Pendiente</Badge>
            )}
          </strong>
        </div>
        <div className="ui-cifra">
          <span>Total de gastos</span>
          <strong>{formatearPesos(resultado.totalGastos)}</strong>
        </div>
      </div>

      <h3 className="ui-subtitulo">Gastos registrados</h3>
      <DataTable
        titulo="Gastos de la transmisión"
        datos={resultado.gastos}
        vacio="Todavía no hay gastos registrados."
        columnas={[
          { titulo: "Fecha", render: (gasto) => formatearFecha(gasto.fecha) },
          { titulo: "Categoría", render: (gasto) => NOMBRE_CATEGORIA_GASTO[gasto.categoria] },
          { titulo: "Monto", numero: true, render: (gasto) => formatearPesos(gasto.monto) },
          { titulo: "Origen → destino", render: (gasto) => (gasto.origen ? `${gasto.origen} → ${gasto.destino}` : "-") },
          { titulo: "Observación", render: (gasto) => gasto.observacion || "-" },
        ]}
      />
    </>
  );
}