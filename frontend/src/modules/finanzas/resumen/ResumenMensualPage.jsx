// Pantalla del resumen mensual y, debajo, la rentabilidad por transmisión.
// El Dueño ve si el mes tuvo ganancia o pérdida; el Contador además revisa
// las transmisiones del mes que todavía tienen saldo pendiente.
import { useCallback, useState } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { obtenerResumenMensual } from "../../../services/reporteService";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import ListaDatos from "../../../components/ui/ListaDatos";
import SelectorMes from "../SelectorMes";
import FichaRentabilidad from "./FichaRentabilidad";
import {
  formatearPesos,
  formatearFecha,
  periodoActual,
  NOMBRE_MES,
  NOMBRE_ESTADO_PAGO,
  TONO_ESTADO_PAGO,
} from "../formato";

export default function ResumenMensualPage() {
  const [periodo, setPeriodo] = useState(periodoActual);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/finanzas", texto: "Finanzas y auspiciadores" }}
        titulo="Rentabilidad y resumen mensual"
        descripcion="Ganancia o pérdida del mes con el detalle de ingresos y egresos, y la rentabilidad de cada transmisión."
      />

      <Card titulo="Resumen del mes">
        <SelectorMes anio={periodo.anio} mes={periodo.mes} onCambiar={setPeriodo} />
        <ResumenDelMes key={`${periodo.anio}-${periodo.mes}`} periodo={periodo} />
      </Card>

      <FichaRentabilidad />
    </section>
  );
}

// Resumen del mes elegido. Se vuelve a crear cada vez que cambia el mes o el año.
function ResumenDelMes({ periodo }) {
  const cargar = useCallback(() => obtenerResumenMensual(periodo.anio, periodo.mes), [periodo]);
  const { datos: resumen, cargando, error } = useFetch(cargar);

  if (cargando) return <p role="status">Calculando el resumen…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;

  const ganancia = resumen.resultadoNeto >= 0;

  return (
    <>
      <Alerta tipo={ganancia ? "exito" : "error"}>
        <strong>
          {ganancia ? "Ganancia" : "Pérdida"} de {NOMBRE_MES[resumen.mes - 1]} {resumen.anio}:{" "}
          {formatearPesos(Math.abs(resumen.resultadoNeto))}
        </strong>
      </Alerta>
      {resumen.mesEnCurso && <Alerta tipo="info">El mes todavía no termina: los valores pueden cambiar.</Alerta>}

      <h3 className="ui-subtitulo">Detalle del mes</h3>
      <ListaDatos
        columnas={1}
        datos={[
          { etiqueta: "Pagos recibidos", valor: formatearPesos(resumen.ingresos.pagos) },
          {
            etiqueta: "(incluye adelantos retenidos de transmisiones canceladas)",
            valor: formatearPesos(resumen.ingresos.adelantosRetenidos),
          },
          { etiqueta: "− Devoluciones de adelantos", valor: formatearPesos(resumen.ingresos.devoluciones) },
          { etiqueta: "Ingresos", valor: <strong>{formatearPesos(resumen.ingresos.total)}</strong> },
          { etiqueta: "+ Aportes cumplidos de auspiciadores", valor: formatearPesos(resumen.aportesCumplidos) },
          { etiqueta: "− Comisiones liquidadas", valor: formatearPesos(resumen.comisiones) },
          { etiqueta: "− Gastos de las transmisiones", valor: formatearPesos(resumen.gastos) },
          { etiqueta: "− Pérdidas de equipos", valor: formatearPesos(resumen.perdidasEquipos) },
          {
            etiqueta: "Rentabilidad de las transmisiones",
            valor: <strong>{formatearPesos(resumen.rentabilidadTransmisiones)}</strong>,
          },
          { etiqueta: "− Compras de equipos", valor: formatearPesos(resumen.comprasEquipos) },
          { etiqueta: "− Costos fijos", valor: formatearPesos(resumen.costosFijos) },
          { etiqueta: "Resultado neto", valor: <strong>{formatearPesos(resumen.resultadoNeto)}</strong> },
        ]}
      />

      <h3 className="ui-subtitulo">Pagos pendientes de las transmisiones del mes</h3>
      <DataTable
        titulo="Pagos pendientes del mes"
        datos={resumen.pagosPendientes}
        claveFila={(pendiente) => pendiente.transmisionId}
        vacio="No hay transmisiones del mes con saldo pendiente."
        columnas={[
          { titulo: "Transmisión", campo: "nombreEvento" },
          { titulo: "Término", render: (pendiente) => formatearFecha(pendiente.termino) },
          { titulo: "Saldo pendiente", numero: true, render: (pendiente) => formatearPesos(pendiente.saldoPendiente) },
          {
            titulo: "Estado de pago",
            render: (pendiente) => (
              <Badge tono={TONO_ESTADO_PAGO[pendiente.estadoPago]}>{NOMBRE_ESTADO_PAGO[pendiente.estadoPago]}</Badge>
            ),
          },
        ]}
      />
    </>
  );
}