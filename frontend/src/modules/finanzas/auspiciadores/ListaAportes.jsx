// Tabla de acuerdos y aportes de auspiciadores.
// La usan AcuerdosPage.jsx (Dueño) y AportesPage.jsx (Contador). Cada pantalla decide el botón
// de cada fila con renderAccion(aporte). Se puede filtrar por auspiciador para ver su historial.
import { useState } from "react";
import Badge from "../../../components/ui/Badge";
import Campo from "../../../components/ui/Campo";
import DataTable from "../../../components/ui/DataTable";
import {
  formatearPesos,
  formatearFecha,
  NOMBRE_TIPO_APORTE,
  NOMBRE_ESTADO_APORTE,
  TONO_ESTADO_APORTE,
} from "../formato";

export default function ListaAportes({ aportes, renderAccion }) {
  const [auspiciadorId, setAuspiciadorId] = useState("");

  // Auspiciadores que tienen acuerdos, sin repetir, para el filtro.
  const auspiciadores = [...new Map(aportes.map((a) => [a.auspiciador.id, a.auspiciador])).values()];
  const visibles = auspiciadorId
    ? aportes.filter((aporte) => String(aporte.auspiciador.id) === auspiciadorId)
    : aportes;

  return (
    <>
      <div className="ui-filtros">
        <Campo etiqueta="Historial de">
          <select value={auspiciadorId} onChange={(evento) => setAuspiciadorId(evento.target.value)}>
            <option value="">Todos los auspiciadores</option>
            {auspiciadores.map((auspiciador) => (
              <option key={auspiciador.id} value={auspiciador.id}>
                {auspiciador.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <DataTable
        titulo="Acuerdos con auspiciadores"
        datos={visibles}
        vacio="Todavía no hay acuerdos con auspiciadores."
        columnas={[
          {
            titulo: "Auspiciador",
            render: (aporte) => (
              <>
                <strong>{aporte.auspiciador.nombre}</strong>
                <small>{aporte.transmision.nombreEvento}</small>
              </>
            ),
          },
          {
            titulo: "Acuerdo",
            render: (aporte) => (
              <>
                {aporte.descripcion}
                <small>{NOMBRE_TIPO_APORTE[aporte.tipo]}</small>
              </>
            ),
          },
          {
            titulo: "Valor",
            numero: true,
            render: (aporte) => (aporte.valorPesos === null ? "Al recibirlo" : formatearPesos(aporte.valorPesos)),
          },
          { titulo: "Fecha comprometida", render: (aporte) => formatearFecha(aporte.fechaComprometida) },
          {
            titulo: "Estado",
            render: (aporte) => (
              <Badge tono={TONO_ESTADO_APORTE[aporte.estadoActual]}>{NOMBRE_ESTADO_APORTE[aporte.estadoActual]}</Badge>
            ),
          },
          {
            titulo: "Detalle",
            render: (aporte) => {
              if (aporte.estado === "CUMPLIDO") return `Recibido el ${formatearFecha(aporte.fechaRecepcion)}`;
              if (aporte.estado === "NO_CUMPLIDO") return aporte.observacion;
              return "";
            },
          },
          { titulo: "Acción", render: (aporte) => renderAccion(aporte) },
        ]}
      />
    </>
  );
}