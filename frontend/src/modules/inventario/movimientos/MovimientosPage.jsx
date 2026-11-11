// M3 · Pantalla: salida y retorno de equipos e incidentes (RF 3.3 y 3.4).
import { useCallback, useState } from "react";
import { movimientosDeTransmision, registrarRetorno, registrarSalidas } from "../../../services/movimientoService";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { fechaHora } from "../../../utils/formato";
import SelectorTransmision from "../../../components/SelectorTransmision";
import { NOMBRE_ESTADO } from "../../../utils/transmision";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import IncidenteModal from "./IncidenteModal";
import { INCIDENTES, RETORNOS, TIPOS_EQUIPO, tonoRetorno } from "../inventario.utils";

const ESTADOS_CON_SALIDA = ["CONFIRMADA", "REALIZADA"];

function FormularioSalida({ transmisionId, equipos, responsables, onRegistrada }) {
  const { sesionExpirada } = useSesion();
  const porDefecto = responsables[0]?.id ?? "";
  const [elegidos, setElegidos] = useState({}); // equipoId -> responsableId
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function alternar(equipoId) {
    setElegidos((anterior) => {
      const nuevo = { ...anterior };
      if (equipoId in nuevo) delete nuevo[equipoId];
      else nuevo[equipoId] = porDefecto;
      return nuevo;
    });
  }

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      const salidas = Object.entries(elegidos).map(([equipoId, responsableId]) => ({
        equipoId: Number(equipoId), responsableId: Number(responsableId),
      }));
      await registrarSalidas(transmisionId, salidas);
      setElegidos({});
      onRegistrada(salidas.length);
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const cantidad = Object.keys(elegidos).length;
  if (!responsables.length) {
    return <Alerta tipo="advertencia">No hay trabajadores activos para hacerse responsables. Regístralos en el módulo Personal.</Alerta>;
  }
  return (
    <>
      <DataTable
        titulo="Equipos que pueden salir"
        datos={equipos}
        vacio="No hay equipos disponibles para salir: asigna kits a la transmisión o revisa los repuestos."
        columnas={[
          { titulo: "Sale", render: (e) => (
            <input type="checkbox" checked={e.id in elegidos} onChange={() => alternar(e.id)} aria-label={`Sale ${e.nombre}`} />
          ) },
          { titulo: "Equipo", render: (e) => <><strong>{e.nombre}</strong><small>{TIPOS_EQUIPO[e.tipo]}{e.numeroSerie ? ` · ${e.numeroSerie}` : ""}</small></> },
          { titulo: "Origen", render: (e) => e.origen === "KIT" ? <Badge tono="info">{e.kit.nombre}</Badge> : <Badge>Repuesto</Badge> },
          { titulo: "Responsable", render: (e) => (
            <select value={elegidos[e.id] ?? ""} disabled={!(e.id in elegidos)} aria-label={`Responsable de ${e.nombre}`}
              onChange={(ev) => setElegidos({ ...elegidos, [e.id]: ev.target.value })} className="ui-select-compacto">
              <option value="">—</option>
              {responsables.map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.asignado ? " (asignado)" : ""}</option>)}
            </select>
          ) },
        ]}
      />
      <Alerta tipo="error">{error}</Alerta>
      {equipos.length > 0 && (
        <div className="ui-botones">
          <Boton onClick={guardar} cargando={guardando} disabled={!cantidad}>
            Registrar salida de {cantidad} equipo(s)
          </Boton>
        </div>
      )}
    </>
  );
}

function MovimientosDeTransmision({ transmisionId, puedeEditar }) {
  const { sesionExpirada } = useSesion();
  const cargar = useCallback(() => movimientosDeTransmision(transmisionId), [transmisionId]);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [aviso, setAviso] = useState(null);
  const [retornos, setRetornos] = useState({}); // salidaId -> estadoRetorno elegido
  const [trabajando, setTrabajando] = useState(null);
  const [incidente, setIncidente] = useState(null);

  async function guardarRetorno(salida) {
    setTrabajando(salida.id);
    setAviso(null);
    try {
      const resultado = await registrarRetorno(salida.id, retornos[salida.id] ?? "BUEN_ESTADO");
      if (resultado.requiereIncidente) setIncidente(resultado);
      else setAviso({ tipo: "exito", texto: `${salida.equipo.nombre} volvió en buen estado y quedó disponible.` });
      recargar();
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setAviso({ tipo: "error", texto: err.message });
    } finally {
      setTrabajando(null);
    }
  }

  if (cargando && !datos) return <p role="status">Cargando movimientos…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  const { transmision, salidas, equiposElegibles, responsables } = datos;
  const puedeSalir = puedeEditar && ESTADOS_CON_SALIDA.includes(transmision.estado);
  const pendientes = salidas.filter((s) => !s.fechaRetorno).length;

  return (
    <>
      <div className="ui-cifras">
        <div className="ui-cifra"><span>Estado</span><strong>{NOMBRE_ESTADO[transmision.estado]}</strong></div>
        <div className="ui-cifra"><span>Inicio</span><strong className="ui-cifra-texto">{fechaHora(transmision.inicio)}</strong></div>
        <div className="ui-cifra"><span>Equipos fuera</span><strong>{pendientes}</strong></div>
        <div className="ui-cifra"><span>Incidentes</span><strong>{salidas.filter((s) => s.incidente).length}</strong></div>
      </div>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      <Card titulo={`Salidas registradas (${salidas.length})`}>
        <DataTable
          titulo="Equipos que salieron a la transmisión"
          datos={salidas}
          vacio="Todavía no sale ningún equipo para esta transmisión."
          columnas={[
            { titulo: "Equipo", render: (s) => <><strong>{s.equipo.nombre}</strong><small>{s.equipo.kit?.nombre ?? "Repuesto"}</small></> },
            { titulo: "Responsable", render: (s) => s.responsable.nombre },
            { titulo: "Salida", render: (s) => fechaHora(s.fechaSalida) },
            { titulo: "Retorno", render: (s) => s.fechaRetorno
              ? <><Badge tono={tonoRetorno(s.estadoRetorno)}>{RETORNOS[s.estadoRetorno]}</Badge><small>{fechaHora(s.fechaRetorno)}</small></>
              : puedeEditar
                ? (
                  <div className="ui-botones">
                    <select value={retornos[s.id] ?? "BUEN_ESTADO"} aria-label={`Estado de retorno de ${s.equipo.nombre}`}
                      onChange={(e) => setRetornos({ ...retornos, [s.id]: e.target.value })} className="ui-select-compacto">
                      {Object.entries(RETORNOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                    </select>
                    <Boton variante="secundario" cargando={trabajando === s.id} disabled={trabajando !== null}
                      onClick={() => guardarRetorno(s)}>Registrar retorno</Boton>
                  </div>
                )
                : <Badge tono="advertencia">Fuera de bodega</Badge> },
            { titulo: "Incidente", render: (s) => s.incidente
              ? <><Badge tono="error">{INCIDENTES[s.incidente.tipo]}</Badge><small>{s.incidente.observacion}</small></>
              : s.fechaRetorno && s.estadoRetorno !== "BUEN_ESTADO"
                ? (puedeEditar
                  ? <Boton variante="peligro" onClick={() => setIncidente(s)}>Registrar incidente</Boton>
                  : <Badge tono="advertencia">Pendiente</Badge>)
                : "—" },
          ]}
        />
      </Card>

      {puedeSalir && (
        <Card titulo="Registrar salida de equipos">
          <FormularioSalida transmisionId={transmisionId} equipos={equiposElegibles} responsables={responsables}
            onRegistrada={(n) => { setAviso({ tipo: "exito", texto: `Salida de ${n} equipo(s) registrada.` }); recargar(); }} />
        </Card>
      )}

      <IncidenteModal
        key={incidente?.id ?? "sin-incidente"}
        salida={incidente}
        onCerrar={() => setIncidente(null)}
        onRegistrado={(registrado) => {
          setIncidente(null);
          setAviso({ tipo: "exito", texto: `Incidente registrado: ${registrado.equipo.nombre} quedó como ${registrado.equipo.estado === "DANADO" ? "dañado" : "perdido"}.` });
          recargar();
        }}
      />
    </>
  );
}

export default function MovimientosPage() {
  const { usuario } = useSesion();
  const puedeEditar = ["JEFE_TECNICO", "ADMIN_DESARROLLO"].includes(usuario.rol);
  const [transmisionId, setTransmisionId] = useState(null);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/inventario", texto: "Inventario y kits" }}
        eyebrow="Requisitos 3.3 y 3.4"
        titulo="Salida y retorno de equipos"
        descripcion="Registra qué equipos salen a cada transmisión, con quién, y cómo vuelven a la bodega."
      />
      <Card>
        <div className="ui-filtros">
          <SelectorTransmision valor={transmisionId} onCambiar={setTransmisionId}
            filtro={(t) => [...ESTADOS_CON_SALIDA, "RENDIDA", "CERRADA"].includes(t.estado)}
            ayuda="Los equipos salen para transmisiones Confirmadas o Realizadas." />
        </div>
      </Card>
      {transmisionId
        ? <MovimientosDeTransmision key={transmisionId} transmisionId={transmisionId} puedeEditar={puedeEditar} />
        : <p className="ui-vacio">Elige una transmisión para registrar la salida o el retorno de sus equipos.</p>}
    </section>
  );
}
