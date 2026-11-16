// M1 · Lista de transmisiones con filtro por estado. Desde aquí se abre la ficha para responder,
// confirmar (RF 1.3, 1.4) o reprogramar, modificar y cancelar (RF 1.6, 1.7, 1.12).
// modo "cambios" muestra solo las Aceptadas y Confirmadas.
import { useCallback, useState } from "react";
import { listarTransmisiones } from "../../../services/transmisionService";
import { useFetch } from "../../../hooks/useFetch";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { fechaHora, pesos } from "../../../utils/formato";
import { NOMBRE_ESTADO, TONO_ESTADO } from "../../../utils/transmision";
import { ESTADOS_MODIFICABLES } from "../transmisiones.utils";
import FichaTransmision from "../ficha/FichaTransmision";

const TEXTOS = {
  estados: {
    eyebrow: "Requisitos 1.3, 1.4 y 1.5",
    titulo: "Estados y confirmación",
    descripcion: "Registra la respuesta del cliente y confirma las transmisiones. Realizada, Rendida y Cerrada avanzan solas.",
  },
  cambios: {
    eyebrow: "Requisitos 1.6, 1.7 y 1.12",
    titulo: "Cambios y cancelaciones",
    descripcion: "Reprograma, modifica los requerimientos o cancela transmisiones Aceptadas o Confirmadas.",
  },
};

export default function TransmisionesPage({ modo = "estados" }) {
  const [estado, setEstado] = useState("");
  const cargar = useCallback(() => listarTransmisiones(estado || undefined), [estado]);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [abierta, setAbierta] = useState(null);
  const textos = TEXTOS[modo];

  const transmisiones = (datos ?? []).filter((t) => modo !== "cambios" || ESTADOS_MODIFICABLES.includes(t.estado));
  const estadosFiltro = modo === "cambios" ? ESTADOS_MODIFICABLES : Object.keys(NOMBRE_ESTADO);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/transmisiones", texto: "Transmisiones y cotización" }}
        eyebrow={textos.eyebrow}
        titulo={textos.titulo}
        descripcion={textos.descripcion}
        extra={<Boton onClick={() => { window.location.hash = "#/transmisiones/registro"; }}>Registrar transmisión</Boton>}
      />

      <Card
        titulo="Transmisiones"
        acciones={<Boton variante="secundario" onClick={recargar} disabled={cargando}>Actualizar</Boton>}
      >
        <div className="ui-filtros">
          <Campo etiqueta="Estado">
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">{modo === "cambios" ? "Aceptadas y Confirmadas" : "Todos los estados"}</option>
              {estadosFiltro.map((clave) => <option key={clave} value={clave}>{NOMBRE_ESTADO[clave]}</option>)}
            </select>
          </Campo>
        </div>
        <Alerta tipo="error">{error}</Alerta>
        {cargando ? <p role="status">Cargando transmisiones…</p> : (
          <DataTable
            titulo="Transmisiones"
            datos={transmisiones}
            vacio="No hay transmisiones con este filtro."
            columnas={[
              { titulo: "Evento", render: (t) => <><strong>{t.nombreEvento}</strong><small>{t.cliente?.nombre}</small></> },
              { titulo: "Inicio", render: (t) => fechaHora(t.inicio) },
              { titulo: "Lugar", campo: "lugar" },
              { titulo: "Estado", render: (t) => <Badge tono={TONO_ESTADO[t.estado]}>{NOMBRE_ESTADO[t.estado]}</Badge> },
              { titulo: "Precio cotizado", numero: true, render: (t) => pesos(t.precioCotizado) },
              { titulo: "Adelanto", render: (t) => (t.requiereAdelanto ? <Badge tono="advertencia">Requiere 50 %</Badge> : "No") },
              { titulo: "Ficha", render: (t) => (
                <Boton variante="secundario" onClick={() => setAbierta(t.id)} aria-label={`Abrir ficha de ${t.nombreEvento}`}>Abrir</Boton>
              ) },
            ]}
          />
        )}
      </Card>

      {abierta && <FichaTransmision id={abierta} onCerrar={() => setAbierta(null)} onCambio={recargar} />}
    </section>
  );
}
