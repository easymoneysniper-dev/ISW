// M1 · Calendario mensual y clientes (RF 1.8–1.11). La ficha se abre con un clic sobre el evento del día.
import { useCallback, useState } from "react";
import { obtenerCalendario } from "../../../services/transmisionService";
import { useFetch } from "../../../hooks/useFetch";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import Pestanas from "../../../components/ui/Pestanas";
import CalendarioMes from "../../../components/ui/CalendarioMes";
import { mesActual } from "../../../utils/formato";
import { NOMBRE_ESTADO, TONO_ESTADO } from "../../../utils/transmision";
import FichaTransmision from "../ficha/FichaTransmision";
import ClientesPanel from "../clientes/ClientesPanel";

const HORA = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", timeStyle: "short" });

export default function CalendarioPage() {
  const [pestana, setPestana] = useState("calendario");
  const [mes, setMes] = useState(mesActual());
  const cargar = useCallback(() => obtenerCalendario(mes), [mes]);
  const { datos, error, recargar } = useFetch(cargar);
  const [abierta, setAbierta] = useState(null);

  const transmisiones = datos?.transmisiones ?? [];
  const delDia = (fecha) => transmisiones.filter((t) => t.fecha === fecha);

  function eventosDelDia(fecha) {
    return delDia(fecha).map((t) => (
      <button key={t.id} type="button" className="ui-evento" onClick={() => setAbierta(t.id)}
        title={`${t.nombreEvento} · ${t.cliente.nombre} · ${NOMBRE_ESTADO[t.estado]}`}>
        <Badge tono={TONO_ESTADO[t.estado]}>{HORA.format(new Date(t.inicio))} {t.nombreEvento}</Badge>
      </button>
    ));
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/transmisiones", texto: "Transmisiones y cotización" }}
        eyebrow="Requisitos 1.8 a 1.11"
        titulo="Calendario y clientes"
        descripcion="Revisa las transmisiones de cada mes y abre su ficha desde la fecha. Mantén el registro de clientes."
      />

      <Pestanas
        activa={pestana}
        onCambiar={setPestana}
        pestanas={[
          {
            clave: "calendario",
            titulo: "Calendario",
            contenido: (
              <Card titulo={`Transmisiones del mes (${transmisiones.length})`}>
                <Alerta tipo="error">{error}</Alerta>
                <CalendarioMes mes={mes} onCambiarMes={setMes} eventosDelDia={eventosDelDia} />
              </Card>
            ),
          },
          { clave: "clientes", titulo: "Clientes", contenido: <ClientesPanel /> },
        ]}
      />

      {abierta && <FichaTransmision id={abierta} onCerrar={() => setAbierta(null)} onCambio={recargar} />}
    </section>
  );
}
