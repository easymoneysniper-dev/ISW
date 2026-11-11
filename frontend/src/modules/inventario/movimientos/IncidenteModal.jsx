// M3 · Ventana para registrar un incidente (RF 3.4).
import { useState } from "react";
import { registrarIncidente } from "../../../services/movimientoService";
import { useSesion } from "../../../hooks/useSesion";
import Modal from "../../../components/ui/Modal";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import { INCIDENTES } from "../inventario.utils";

const TIPOS_SEGUN_RETORNO = { DANADO: ["DANO"], NO_DEVUELTO: ["PERDIDA", "ROBO"] };

export default function IncidenteModal({ salida, onCerrar, onRegistrado }) {
  const { sesionExpirada } = useSesion();
  const tipos = salida ? TIPOS_SEGUN_RETORNO[salida.estadoRetorno] ?? [] : [];
  const [tipo, setTipo] = useState(tipos[0] ?? "");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      onRegistrado(await registrarIncidente(salida.id, tipo, observacion));
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto={salida !== null}
      titulo="Registrar incidente"
      onCerrar={onCerrar}
      acciones={<>
        <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>Cancelar</Boton>
        <Boton onClick={guardar} cargando={guardando} disabled={!tipo || !observacion.trim()}>Registrar incidente</Boton>
      </>}
    >
      {salida && (
        <>
          <p>
            <strong>{salida.equipo.nombre}</strong> · responsable: {salida.responsable.nombre}.
            El equipo quedará como {tipo === "DANO" ? "dañado" : "perdido"} en el inventario.
          </p>
          <div className="ui-formulario">
            <Campo etiqueta="Tipo de incidente *">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {tipos.map((valor) => <option key={valor} value={valor}>{INCIDENTES[valor]}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Observación *" anchoCompleto ayuda="Qué pasó, dónde y cualquier detalle útil.">
              <textarea value={observacion} maxLength={500} onChange={(e) => setObservacion(e.target.value)} />
            </Campo>
          </div>
          <Alerta tipo="error">{error}</Alerta>
        </>
      )}
    </Modal>
  );
}
