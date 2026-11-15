// M1 · Acciones de la ficha según el estado: responder (1.3), confirmar (1.4), reprogramar (1.6),
// cancelar (1.7) y modificar requerimientos (1.12). Las reglas las vuelve a revisar el backend.
import { useState } from "react";
import {
  cancelarTransmision, confirmarTransmision, modificarRequerimientos, reprogramarTransmision, responderCotizacion,
} from "../../../services/transmisionService";
import { useAccion } from "../../../hooks/useAccion";
import Boton from "../../../components/ui/Boton";
import Campo from "../../../components/ui/Campo";
import Alerta from "../../../components/ui/Alerta";
import { NOMBRE_ESTADO, horarioAIso, horarioDesdeIso } from "../../../utils/transmision";
import { pesos } from "../../../utils/formato";
import { ESTADOS_MODIFICABLES } from "../transmisiones.utils";
import HorarioCampos from "../HorarioCampos";

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export default function AccionesTransmision({ transmision: t, onCambiada }) {
  const { ejecutar, guardando, error } = useAccion();
  const [formulario, setFormulario] = useState(null); // "reprogramar" | "requerimientos" | "cancelar"
  const modificable = ESTADOS_MODIFICABLES.includes(t.estado);

  async function hacer(accion, texto) {
    const respuesta = await ejecutar(accion);
    if (respuesta) onCambiada(respuesta, texto);
  }

  if (t.estado !== "COTIZADA" && !modificable) {
    return <Alerta tipo="info">En estado {NOMBRE_ESTADO[t.estado]} no hay acciones manuales: los estados Realizada, Rendida y Cerrada avanzan solos.</Alerta>;
  }

  return (
    <>
      <h3 className="ui-subtitulo">Acciones</h3>
      <div className="ui-botones">
        {t.estado === "COTIZADA" && (
          <>
            <Boton cargando={guardando} onClick={() => hacer(() => responderCotizacion(t.id, "ACEPTADA"), "El cliente aceptó la cotización.")}>
              Registrar aceptación del cliente
            </Boton>
            <Boton variante="peligro" disabled={guardando} onClick={() => hacer(() => responderCotizacion(t.id, "RECHAZADA"), "El cliente rechazó la cotización.")}>
              Registrar rechazo del cliente
            </Boton>
          </>
        )}
        {t.estado === "ACEPTADA" && (
          <Boton cargando={guardando} onClick={() => hacer(() => confirmarTransmision(t.id), "Transmisión confirmada.")}>
            Confirmar transmisión
          </Boton>
        )}
        {modificable && (
          <>
            <Boton variante="secundario" disabled={guardando} onClick={() => setFormulario("reprogramar")}>Reprogramar</Boton>
            <Boton variante="secundario" disabled={guardando} onClick={() => setFormulario("requerimientos")}>Modificar requerimientos</Boton>
            <Boton variante="peligro" disabled={guardando} onClick={() => setFormulario("cancelar")}>Cancelar transmisión</Boton>
          </>
        )}
      </div>
      {t.estado === "ACEPTADA" && t.requiereAdelanto && t.situacionFinanciera.estadoPago === "PENDIENTE" && (
        <Alerta tipo="advertencia">
          Para confirmar, el Contador debe registrar el adelanto del 50 % ({pesos(t.situacionFinanciera.adelantoMinimo)}).
        </Alerta>
      )}
      <Alerta tipo="error">{error}</Alerta>

      {formulario === "reprogramar" && (
        <FormReprogramar t={t} guardando={guardando} onCancelar={() => setFormulario(null)}
          onEnviar={(horario) => hacer(() => reprogramarTransmision(t.id, horario), "Transmisión reprogramada.")} />
      )}
      {formulario === "requerimientos" && (
        <FormRequerimientos t={t} guardando={guardando} onCancelar={() => setFormulario(null)}
          onEnviar={(cambios) => hacer(() => modificarRequerimientos(t.id, cambios), "Requerimientos actualizados.")} />
      )}
      {formulario === "cancelar" && (
        <FormCancelar t={t} guardando={guardando} onCancelar={() => setFormulario(null)}
          onEnviar={(datos) => hacer(() => cancelarTransmision(t.id, datos), "Transmisión cancelada.")} />
      )}
    </>
  );
}

function Botones({ guardando, texto, onCancelar }) {
  return (
    <div className="ui-botones">
      <Boton type="submit" cargando={guardando}>{texto}</Boton>
      <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>Volver</Boton>
    </div>
  );
}

function FormReprogramar({ t, guardando, onEnviar, onCancelar }) {
  const [horario, setHorario] = useState(horarioDesdeIso(t.inicio, t.termino));
  const [intento, setIntento] = useState(false);
  const resultado = horarioAIso(horario);

  function enviar(e) {
    e.preventDefault();
    setIntento(true);
    if (!resultado.error) onEnviar({ inicio: resultado.inicio, termino: resultado.termino });
  }

  return (
    <form onSubmit={enviar}>
      <Alerta tipo="advertencia">Al reprogramar se libera el personal y los kits asignados; hay que asignarlos otra vez.</Alerta>
      <div className="ui-formulario">
        <HorarioCampos valor={horario} onCambiar={setHorario} resultado={resultado} mostrarError={intento} />
      </div>
      <Botones guardando={guardando} texto="Guardar nuevo horario" onCancelar={onCancelar} />
    </form>
  );
}

function FormRequerimientos({ t, guardando, onEnviar, onCancelar }) {
  const [datos, setDatos] = useState({
    cantidadCamaras: t.cantidadCamaras, tiempoTrasladoMin: t.tiempoTrasladoMin, precioBase: t.precioBase, ajuste: t.ajuste,
  });
  const cambio = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  function enviar(e) {
    e.preventDefault();
    // Solo se envían los datos que cambiaron.
    const cambios = Object.fromEntries(
      Object.entries(datos).map(([campo, valor]) => [campo, Number(valor)]).filter(([campo, valor]) => valor !== t[campo])
    );
    onEnviar(cambios);
  }

  return (
    <form onSubmit={enviar}>
      <p>Los kits se cambian en Inventario y kits → Asignar kits. Al guardar, el precio cotizado y el adelanto se recalculan.</p>
      <div className="ui-formulario">
        <Campo etiqueta="Cantidad de cámaras *"><input type="number" min={1} max={50} required value={datos.cantidadCamaras} onChange={cambio("cantidadCamaras")} /></Campo>
        <Campo etiqueta="Tiempo de traslado (min)"><input type="number" min={0} max={1440} required value={datos.tiempoTrasladoMin} onChange={cambio("tiempoTrasladoMin")} /></Campo>
        <Campo etiqueta="Precio base ($) *"><input type="number" min={1} step={1} required value={datos.precioBase} onChange={cambio("precioBase")} /></Campo>
        <Campo etiqueta="Ajuste negociado ($)" ayuda="Puede ser negativo (descuento)."><input type="number" step={1} required value={datos.ajuste} onChange={cambio("ajuste")} /></Campo>
      </div>
      <Botones guardando={guardando} texto="Guardar requerimientos" onCancelar={onCancelar} />
    </form>
  );
}

function FormCancelar({ t, guardando, onEnviar, onCancelar }) {
  const [motivo, setMotivo] = useState("");
  const [decision, setDecision] = useState("");
  const huboAdelanto = t.situacionFinanciera.totalPagado > 0;
  const faltanMenosDeSieteDias = new Date(t.inicio) - new Date() < SIETE_DIAS_MS;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onEnviar({ motivo, ...(huboAdelanto ? { decisionAdelanto: decision } : {}) }); }}>
      {faltanMenosDeSieteDias && huboAdelanto && <Alerta tipo="advertencia">Faltan menos de siete días para el evento: es posible retener el adelanto.</Alerta>}
      <div className="ui-formulario">
        <Campo etiqueta="Motivo de la cancelación *" anchoCompleto>
          <textarea required maxLength={500} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
        {huboAdelanto && (
          <Campo etiqueta={`Adelanto pagado (${pesos(t.situacionFinanciera.totalPagado)}) *`}>
            <select required value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="">Elige qué hacer con el adelanto</option>
              <option value="RETENER">Retener</option>
              <option value="DEVOLVER">Devolver (lo registra el Contador)</option>
            </select>
          </Campo>
        )}
      </div>
      <Botones guardando={guardando} texto="Cancelar transmisión" onCancelar={onCancelar} />
    </form>
  );
}
