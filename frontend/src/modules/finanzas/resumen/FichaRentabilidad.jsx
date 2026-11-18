// Ficha de rentabilidad de una transmisión.
// La usa ResumenMensualPage.jsx, debajo del resumen del mes. Dueño y Contador la consultan.
// El backend solo la entrega si la transmisión está Rendida o Cerrada; si no, se muestra su mensaje.
import { useCallback, useState } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { obtenerRentabilidad } from "../../../services/reporteService";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import ListaDatos from "../../../components/ui/ListaDatos";
import SelectorTransmision from "../SelectorTransmision";
import { formatearPesos } from "../formato";

export default function FichaRentabilidad() {
  const [transmision, setTransmision] = useState(null);

  return (
    <Card titulo="Rentabilidad por transmisión">
      <p>Solo se puede revisar cuando la transmisión está Rendida o Cerrada.</p>
      <SelectorTransmision transmision={transmision} onCambiar={setTransmision} />
      {transmision && <Ficha key={transmision.id} transmisionId={transmision.id} />}
    </Card>
  );
}

// Ficha de la transmisión elegida. Se vuelve a crear cada vez que se elige otra.
function Ficha({ transmisionId }) {
  const cargar = useCallback(() => obtenerRentabilidad(transmisionId), [transmisionId]);
  const { datos: ficha, cargando, error } = useFetch(cargar);

  if (cargando) return <p role="status">Calculando la rentabilidad…</p>;
  if (error) return <Alerta tipo="advertencia">{error}</Alerta>;

  const ganancia = ficha.rentabilidad >= 0;

  return (
    <>
      <h3 className="ui-subtitulo">{ficha.nombreEvento}</h3>
      <ListaDatos
        columnas={1}
        datos={[
          { etiqueta: "Pagos recibidos (menos devoluciones)", valor: formatearPesos(ficha.ingresos) },
          { etiqueta: "+ Aportes cumplidos de auspiciadores", valor: formatearPesos(ficha.aportesCumplidos) },
          { etiqueta: "− Comisiones liquidadas", valor: formatearPesos(ficha.comisiones) },
          { etiqueta: "− Gastos", valor: formatearPesos(ficha.gastos) },
          { etiqueta: "− Pérdidas de equipos", valor: formatearPesos(ficha.perdidasEquipos) },
          {
            etiqueta: "Rentabilidad",
            valor: <Badge tono={ganancia ? "exito" : "error"}>{formatearPesos(ficha.rentabilidad)}</Badge>,
          },
        ]}
      />
    </>
  );
}