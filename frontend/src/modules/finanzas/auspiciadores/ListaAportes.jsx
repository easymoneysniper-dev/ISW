// Tabla de acuerdos y aportes de auspiciadores.
// La usan AcuerdosPage.jsx (Dueño) y AportesPage.jsx (Contador). Cada pantalla decide el botón
// de cada fila con renderAccion(aporte). Se puede filtrar por auspiciador para ver su historial.
import { useState } from "react";
import {
  formatearPesos,
  formatearFecha,
  NOMBRE_TIPO_APORTE,
  NOMBRE_ESTADO_APORTE,
  COLOR_ESTADO_APORTE,
} from "../formato";

function ListaAportes({ aportes, renderAccion }) {
  const [auspiciadorId, setAuspiciadorId] = useState("");

  // Auspiciadores que tienen acuerdos, sin repetir, para el filtro.
  const auspiciadores = [...new Map(aportes.map((a) => [a.auspiciador.id, a.auspiciador])).values()];
  const visibles = auspiciadorId
    ? aportes.filter((aporte) => String(aporte.auspiciador.id) === auspiciadorId)
    : aportes;

  if (aportes.length === 0) {
    return <p>Todavía no hay acuerdos con auspiciadores.</p>;
  }

  return (
    <>
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="filtroAuspiciador">Historial de </label>
        <select
          id="filtroAuspiciador"
          value={auspiciadorId}
          onChange={(evento) => setAuspiciadorId(evento.target.value)}
        >
          <option value="">Todos los auspiciadores</option>
          {auspiciadores.map((auspiciador) => (
            <option key={auspiciador.id} value={auspiciador.id}>
              {auspiciador.nombre}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Auspiciador</th>
            <th>Transmisión</th>
            <th>Tipo</th>
            <th>Acuerdo</th>
            <th>Valor</th>
            <th>Fecha comprometida</th>
            <th>Estado</th>
            <th>Detalle</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((aporte) => {
            const color = COLOR_ESTADO_APORTE[aporte.estadoActual];

            return (
              <tr key={aporte.id}>
                <td>{aporte.auspiciador.nombre}</td>
                <td>{aporte.transmision.nombreEvento}</td>
                <td>{NOMBRE_TIPO_APORTE[aporte.tipo]}</td>
                <td>{aporte.descripcion}</td>
                <td>{aporte.valorPesos === null ? "Al recibirlo" : formatearPesos(aporte.valorPesos)}</td>
                <td>{formatearFecha(aporte.fechaComprometida)}</td>
                <td>
                  <span
                    style={{
                      backgroundColor: color.fondo,
                      color: color.texto,
                      padding: "0.1rem 0.5rem",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {NOMBRE_ESTADO_APORTE[aporte.estadoActual]}
                  </span>
                </td>
                <td>
                  {aporte.estado === "CUMPLIDO" && `Recibido el ${formatearFecha(aporte.fechaRecepcion)}`}
                  {aporte.estado === "NO_CUMPLIDO" && aporte.observacion}
                </td>
                <td>{renderAccion(aporte)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default ListaAportes;