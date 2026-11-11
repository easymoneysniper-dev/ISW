// M3 · Pantalla: incidentes y reporte mensual de compras y pérdidas (RF 3.4 y 3.6).
import { useCallback, useState } from "react";
import { obtenerReporteMensual } from "../../../services/equipoService";
import { useFetch } from "../../../hooks/useFetch";
import { fechaDia, mesActual, pesos } from "../../../utils/formato";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { ESTADOS_EQUIPO, INCIDENTES, TIPOS_EQUIPO, tonoEstadoEquipo } from "../inventario.utils";

function Reporte({ mes }) {
  const cargar = useCallback(() => obtenerReporteMensual(mes), [mes]);
  const { datos, cargando, error } = useFetch(cargar);

  if (cargando) return <p role="status">Generando reporte…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  const { compras, perdidas, bajas, incidentes } = datos;

  return (
    <>
      <div className="ui-cifras" aria-live="polite">
        <div className="ui-cifra"><span>Compras ({compras.cantidad})</span><strong>{pesos(compras.total)}</strong></div>
        <div className="ui-cifra"><span>Pérdidas y robos ({perdidas.cantidad})</span><strong>{pesos(perdidas.total)}</strong></div>
        <div className="ui-cifra"><span>Equipos dados de baja</span><strong>{bajas.cantidad}</strong></div>
        <div className="ui-cifra"><span>Incidentes del mes</span><strong>{incidentes.length}</strong></div>
      </div>

      <Card titulo="Compras de equipos">
        <DataTable
          titulo="Compras del mes"
          datos={compras.equipos}
          vacio="No hay compras registradas en este mes."
          columnas={[
            { titulo: "Fecha", render: (e) => fechaDia(e.fechaCompra) },
            { titulo: "Equipo", render: (e) => <><strong>{e.nombre}</strong><small>{TIPOS_EQUIPO[e.tipo]}{e.numeroSerie ? ` · ${e.numeroSerie}` : ""}</small></> },
            { titulo: "Estado actual", render: (e) => <Badge tono={tonoEstadoEquipo(e.estado)}>{ESTADOS_EQUIPO[e.estado]}</Badge> },
            { titulo: "Precio", numero: true, render: (e) => pesos(e.precioCompra) },
          ]}
        />
      </Card>

      <Card titulo="Pérdidas y robos">
        <DataTable
          titulo="Pérdidas del mes"
          datos={perdidas.incidentes}
          vacio="No hubo pérdidas ni robos en este mes."
          columnas={[
            { titulo: "Fecha", render: (i) => fechaDia(i.fecha) },
            { titulo: "Equipo", render: (i) => <><strong>{i.equipo.nombre}</strong><small>{i.equipo.numeroSerie ?? "Sin serie"}</small></> },
            { titulo: "Transmisión", render: (i) => <>{i.transmision.nombreEvento}<small>Responsable: {i.responsable.nombre}</small></> },
            { titulo: "Tipo", render: (i) => <Badge tono="error">{INCIDENTES[i.tipo]}</Badge> },
            { titulo: "Monto", numero: true, render: (i) => pesos(i.equipo.precioCompra) },
          ]}
        />
      </Card>

      <Card titulo="Equipos dados de baja">
        <DataTable
          titulo="Bajas del mes"
          datos={bajas.equipos}
          vacio="No se dieron equipos de baja en este mes."
          columnas={[
            { titulo: "Fecha de baja", render: (e) => fechaDia(e.fechaBaja) },
            { titulo: "Equipo", render: (e) => <><strong>{e.nombre}</strong><small>{TIPOS_EQUIPO[e.tipo]}</small></> },
            { titulo: "Precio de compra", numero: true, render: (e) => pesos(e.precioCompra) },
          ]}
        />
      </Card>

      <Card titulo="Todos los incidentes del mes">
        <DataTable
          titulo="Incidentes del mes"
          datos={incidentes}
          vacio="No hubo incidentes en este mes."
          columnas={[
            { titulo: "Fecha", render: (i) => fechaDia(i.fecha) },
            { titulo: "Equipo", render: (i) => i.equipo.nombre },
            { titulo: "Transmisión", render: (i) => i.transmision.nombreEvento },
            { titulo: "Responsable", render: (i) => i.responsable.nombre },
            { titulo: "Tipo", render: (i) => <Badge tono={i.tipo === "DANO" ? "advertencia" : "error"}>{INCIDENTES[i.tipo]}</Badge> },
            { titulo: "Observación", campo: "observacion" },
          ]}
        />
      </Card>
    </>
  );
}

export default function ReportePage() {
  const [mes, setMes] = useState(mesActual);
  const mesValido = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/inventario", texto: "Inventario y kits" }}
        eyebrow="Requisitos 3.4 y 3.6"
        titulo="Incidentes y reporte mensual"
        descripcion="Compras, pérdidas y bajas de equipos del mes, con sus montos. Los incidentes se registran al marcar el retorno."
      />
      <Card>
        <div className="ui-filtros">
          <Campo etiqueta="Mes del reporte">
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} required />
          </Campo>
        </div>
      </Card>
      {mesValido ? <Reporte key={mes} mes={mes} /> : <p className="ui-vacio">Selecciona un mes para generar el reporte.</p>}
    </section>
  );
}
