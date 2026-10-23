import { useEffect, useState } from "react";
import { obtenerCompras } from "../../services/equipoService";
import { useSesion } from "../../hooks/useSesion";
import { fecha, pesos, mesActual, estadosEquipo } from "./equipo.utils";

function ResultadoCompras({ mes }) {
  const { sesionExpirada } = useSesion();
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let activo = true;
    obtenerCompras(mes).then((datos) => { if (activo) setReporte(datos); }).catch((err) => {
      if (!activo) return;
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    });
    return () => { activo = false; };
  }, [mes, sesionExpirada]);

  if (error) return <p className="menu-error" role="alert">{error}</p>;
  if (!reporte) return <p role="status">Cargando compras…</p>;
  return <>
    <div className="equipo-resumen" aria-live="polite"><span><strong>{reporte.cantidad}</strong> {reporte.cantidad === 1 ? "equipo comprado" : "equipos comprados"}</span><span>Total de compras <strong>{pesos(reporte.total)}</strong></span></div>
    {reporte.equipos.length === 0 ? <p className="equipo-vacio">No hay compras registradas para este mes.</p> :
      <div className="equipo-tabla-scroll" tabIndex={0} role="region" aria-label="Compras del mes">
        <table><caption className="equipo-sr">Compras de equipos de {mes}</caption><thead><tr><th>Fecha de compra</th><th>Equipo</th><th>Serie</th><th>Estado actual</th><th>Precio de compra</th></tr></thead>
          <tbody>{reporte.equipos.map((equipo) => <tr key={equipo.id}><td>{fecha(equipo.fechaCompra)}</td><td>{equipo.nombre}</td><td>{equipo.numeroSerie || "Sin serie"}</td><td>{estadosEquipo[equipo.estado]}</td><td className="equipo-importe">{pesos(equipo.precioCompra)}</td></tr>)}</tbody>
        </table>
      </div>}
  </>;
}

export default function ComprasEquipos() {
  const [mes, setMes] = useState(mesActual);
  const [revision, setRevision] = useState(0);
  return <section className="equipo-panel" aria-labelledby="compras-titulo">
    <h2 id="compras-titulo">Compras mensuales de equipos</h2>
    <p className="equipo-ayuda">Se incluyen las compras del mes seleccionado, también las de equipos que ahora están dados de baja.</p>
    <div className="equipo-filtros">
      <label>Mes de compra<input type="month" value={mes} onChange={(e) => setMes(e.target.value)} required /></label>
      <button onClick={() => setRevision((valor) => valor + 1)} disabled={!mes}>Actualizar reporte</button>
    </div>
    {/^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? <ResultadoCompras key={`${mes}-${revision}`} mes={mes} /> : <p>Selecciona un mes para consultar las compras.</p>}
  </section>;
}
