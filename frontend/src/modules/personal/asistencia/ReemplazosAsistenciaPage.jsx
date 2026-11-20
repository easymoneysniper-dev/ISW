// M2 · Reemplazos, retiros, asistencia y cámaras utilizadas (RF 2.5 a 2.7). Lo usa modules/personal/index.jsx. Llama a asignacionService y transmisionService.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import {
  obtenerContextoAsignacion,
  reemplazarAsignacion,
  retirarAsignacion,
  registrarAsistencia,
  registrarCamarasUtilizadas,
} from "../../../services/asignacionService";
import SelectorTransmision from "../../../components/SelectorTransmision";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import {
  ETIQUETAS_ROL,
  ETIQUETAS_ASISTENCIA,
  TONO_ASISTENCIA,
  TONO_ESTADO_HISTORIAL,
  puedeGestionar,
} from "../personal.utils";

function ReemplazarModal({ asignacion, candidatos, onCerrar, onConfirmado }) {
  const accion = useAccion();
  const [nuevoTrabajadorId, setNuevoTrabajadorId] = useState("");
  const [roles, setRoles] = useState(asignacion.roles || []);
  const [porcentaje, setPorcentaje] = useState(
    asignacion.porcentajeComision !== null && asignacion.porcentajeComision !== undefined
      ? String(asignacion.porcentajeComision)
      : ""
  );
  const [motivo, setMotivo] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");

  const opciones = candidatos.filter((c) => c.id !== asignacion.trabajadorId);
  const seleccionado = opciones.find((c) => String(c.id) === String(nuevoTrabajadorId));
  const tieneAdvertencias = (seleccionado?.advertencias?.length ?? 0) > 0;

  function elegirCandidato(idSel) {
    setNuevoTrabajadorId(idSel);
    setErrorValidacion("");
    const cand = opciones.find((c) => String(c.id) === String(idSel));
    if (!cand) {
      setRoles([]);
      return;
    }
    const comunes = asignacion.roles.filter((r) => cand.roles.includes(r));
    setRoles(comunes.length > 0 ? comunes : cand.roles.slice(0, 1));
  }

  function alternarRol(rol) {
    setRoles((prev) => (prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]));
  }

  async function guardar() {
    setErrorValidacion("");
    if (!nuevoTrabajadorId) {
      setErrorValidacion("Debes seleccionar al trabajador reemplazante.");
      return;
    }
    if (motivo.trim().length < 3) {
      setErrorValidacion("Debes ingresar el motivo del reemplazo (mínimo 3 caracteres).");
      return;
    }
    if (roles.length === 0) {
      setErrorValidacion("El trabajador reemplazante debe asumir al menos un rol.");
      return;
    }

    const respuesta = await accion.ejecutar(() =>
      reemplazarAsignacion(asignacion.id, {
        nuevoTrabajadorId: Number(nuevoTrabajadorId),
        motivo: motivo.trim(),
        roles,
        porcentajeComision: porcentaje !== "" ? Number(porcentaje) : null,
        aceptarAdvertencia: tieneAdvertencias,
      })
    );

    if (respuesta) onConfirmado();
  }

  return (
    <Modal
      abierto
      titulo={`Reemplazar a ${asignacion.trabajador?.nombre}`}
      onCerrar={onCerrar}
      ancho={680}
      acciones={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={accion.guardando}>
            Cancelar
          </Boton>
          <Boton cargando={accion.guardando} onClick={guardar}>
            {tieneAdvertencias ? "Aceptar advertencia y reemplazar" : "Confirmar reemplazo"}
          </Boton>
        </>
      }
    >
      <fieldset disabled={accion.guardando} className="ui-fieldset">
        <div className="ui-formulario">
          <Campo etiqueta="Trabajador reemplazante (activo) *" anchoCompleto>
            <select value={nuevoTrabajadorId} onChange={(e) => elegirCandidato(e.target.value)}>
              <option value="">Selecciona al reemplazante…</option>
              {opciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.disponible ? "[Disponible] " : "[Con advertencia] "}
                  {c.nombre} — {c.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="% Comisión para el reemplazante" ayuda="Si se deja vacío hereda el porcentaje anterior.">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
            />
          </Campo>

          <Campo etiqueta="Motivo del reemplazo *" anchoCompleto>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Imprevisto médico o problema de transporte"
            />
          </Campo>
        </div>

        {seleccionado && (
          <>
            <h3 className="ui-subtitulo">Roles que asumirá el reemplazante *</h3>
            <div className="ui-botones">
              {seleccionado.roles.map((rol) => (
                <label key={rol} className="ui-casilla">
                  <input
                    type="checkbox"
                    checked={roles.includes(rol)}
                    onChange={() => alternarRol(rol)}
                  />
                  {ETIQUETAS_ROL[rol] || rol}
                </label>
              ))}
            </div>

            {tieneAdvertencias && (
              <Alerta tipo="advertencia">
                <strong>Advertencias del reemplazante:</strong> {seleccionado.advertencias.join(". ")}
              </Alerta>
            )}
          </>
        )}
      </fieldset>

      <Alerta tipo="error">{errorValidacion || accion.error}</Alerta>
    </Modal>
  );
}

function RetirarModal({ asignacion, onCerrar, onConfirmado }) {
  const accion = useAccion();
  const [motivo, setMotivo] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");

  async function guardar(e) {
    e.preventDefault();
    setErrorValidacion("");
    if (motivo.trim().length < 3) {
      setErrorValidacion("Debes ingresar el motivo del retiro (mínimo 3 caracteres).");
      return;
    }

    const respuesta = await accion.ejecutar(() => retirarAsignacion(asignacion.id, motivo.trim()));
    if (respuesta) onConfirmado();
  }

  return (
    <Modal abierto titulo={`Retirar asignación de ${asignacion.trabajador?.nombre}`} onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <p>
          El trabajador dejará de estar activo en esta transmisión sin asignar reemplazante, conservando el registro en el historial.
        </p>

        <div className="ui-formulario">
          <Campo etiqueta="Motivo del retiro *" anchoCompleto>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Reducción de cámaras solicitada por el cliente"
            />
          </Campo>
        </div>

        <Alerta tipo="error">{errorValidacion || accion.error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" variante="peligro" cargando={accion.guardando}>
            Confirmar retiro
          </Boton>
          <Boton variante="secundario" onClick={onCerrar} disabled={accion.guardando}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}

function AsistenciaDeTransmision({ transmisionId, puedeEditar }) {
  const cargar = useCallback(() => obtenerContextoAsignacion(transmisionId), [transmisionId]);
  const { datos: contexto, cargando, error, recargar } = useFetch(cargar);
  const asistenciaAccion = useAccion();
  const camarasAccion = useAccion();

  const [camarasEditadas, setCamarasEditadas] = useState(null);
  const [porReemplazar, setPorReemplazar] = useState(null);
  const [porRetirar, setPorRetirar] = useState(null);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  if (cargando && !contexto) return <p role="status">Cargando asignaciones de la transmisión…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  if (!contexto) return null;

  const camarasValor =
    camarasEditadas ??
    (contexto.transmision?.camarasUtilizadas !== null &&
    contexto.transmision?.camarasUtilizadas !== undefined
      ? String(contexto.transmision.camarasUtilizadas)
      : String(contexto.transmision?.cantidadCamaras ?? ""));

  const historialBajas = contexto.historialAsignaciones ?? [];

  async function cambiarAsistenciaFila(asignacionId, nuevaAsistencia) {
    setErrorValidacion("");
    setMensaje("");
    const actualizada = await asistenciaAccion.ejecutar(() =>
      registrarAsistencia(asignacionId, nuevaAsistencia)
    );
    if (!actualizada) return;

    setMensaje(`Asistencia actualizada a «${ETIQUETAS_ASISTENCIA[nuevaAsistencia]}».`);
    recargar();
  }

  async function guardarCamarasEvento(e) {
    e.preventDefault();
    setErrorValidacion("");
    setMensaje("");

    const valor = camarasValor === "" ? null : Number(camarasValor);
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) {
      setErrorValidacion("Ingresa un número válido de cámaras utilizadas.");
      return;
    }

    const actualizada = await camarasAccion.ejecutar(() =>
      registrarCamarasUtilizadas(transmisionId, valor)
    );
    if (!actualizada) return;

    setMensaje("Cantidad de cámaras utilizadas guardada correctamente.");
    setCamarasEditadas(null);
    recargar();
  }

  return (
    <>
      <Alerta tipo="exito">{mensaje}</Alerta>
      <Alerta tipo="error">{errorValidacion || asistenciaAccion.error || camarasAccion.error}</Alerta>

      <Card titulo="Cámaras efectivamente utilizadas">
        <form className="ui-filtros" onSubmit={guardarCamarasEvento}>
          <Campo
            etiqueta={`Cámaras utilizadas (cotizadas: ${contexto.transmision.cantidadCamaras})`}
          >
            <input
              type="number"
              min="0"
              max={contexto.transmision.cantidadCamaras}
              disabled={!puedeEditar || camarasAccion.guardando}
              value={camarasValor}
              onChange={(e) => setCamarasEditadas(e.target.value)}
            />
          </Campo>
          {puedeEditar && (
            <Boton type="submit" cargando={camarasAccion.guardando}>
              Guardar cámaras
            </Boton>
          )}
        </form>
      </Card>

      <Card
        titulo={`Personal activo y asistencia (${contexto.asignaciones.length})`}
        acciones={
          <Boton variante="secundario" onClick={recargar} disabled={cargando}>
            Actualizar
          </Boton>
        }
      >
        <DataTable
          titulo="Personal activo y asistencia"
          datos={contexto.asignaciones}
          vacio="No hay trabajadores activos asignados en esta transmisión."
          columnas={[
            { titulo: "Trabajador", render: (a) => <strong>{a.trabajador?.nombre}</strong> },
            {
              titulo: "Roles",
              render: (a) => a.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ") || "—",
            },
            {
              titulo: "Trazabilidad",
              render: (a) =>
                a.reemplazaANombre ? `Reemplazó a ${a.reemplazaANombre}` : "Asignación original",
            },
            {
              titulo: "Asistencia",
              render: (a) =>
                puedeEditar ? (
                  <select
                    className="ui-select-compacto"
                    aria-label={`Asistencia de ${a.trabajador?.nombre}`}
                    value={a.asistencia}
                    disabled={asistenciaAccion.guardando}
                    onChange={(e) => cambiarAsistenciaFila(a.id, e.target.value)}
                  >
                    {Object.entries(ETIQUETAS_ASISTENCIA).map(([valor, texto]) => (
                      <option key={valor} value={valor}>
                        {texto}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tono={TONO_ASISTENCIA[a.asistencia] ?? "neutro"}>
                    {ETIQUETAS_ASISTENCIA[a.asistencia] ?? a.asistencia}
                  </Badge>
                ),
            },
            ...(puedeEditar
              ? [
                  {
                    titulo: "Acciones",
                    render: (a) => (
                      <div className="ui-botones">
                        <Boton variante="secundario" onClick={() => setPorReemplazar(a)}>
                          Reemplazar
                        </Boton>
                        <Boton variante="peligro" onClick={() => setPorRetirar(a)}>
                          Retirar
                        </Boton>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Card titulo={`Historial de reemplazos y retiros (${historialBajas.length})`}>
        <DataTable
          titulo="Historial de reemplazos y retiros"
          datos={historialBajas}
          vacio="No se han registrado reemplazos ni retiros en esta transmisión."
          columnas={[
            { titulo: "Trabajador", render: (h) => <strong>{h.trabajador?.nombre}</strong> },
            {
              titulo: "Estado",
              render: (h) => (
                <Badge tono={TONO_ESTADO_HISTORIAL[h.estado] ?? "neutro"}>{h.estado}</Badge>
              ),
            },
            {
              titulo: "Reemplazado por",
              render: (h) => h.reemplazadaPorNombre || "Sin reemplazo",
            },
            {
              titulo: "Roles que tenía",
              render: (h) => h.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ") || "—",
            },
            { titulo: "Motivo registrado", render: (h) => h.motivo || "—" },
          ]}
        />
      </Card>

      {porReemplazar && (
        <ReemplazarModal
          key={porReemplazar.id}
          asignacion={porReemplazar}
          candidatos={contexto.candidatos}
          onCerrar={() => setPorReemplazar(null)}
          onConfirmado={() => {
            setMensaje(`Reemplazo de ${porReemplazar.trabajador?.nombre} registrado correctamente.`);
            setPorReemplazar(null);
            recargar();
          }}
        />
      )}

      {porRetirar && (
        <RetirarModal
          key={porRetirar.id}
          asignacion={porRetirar}
          onCerrar={() => setPorRetirar(null)}
          onConfirmado={() => {
            setMensaje(
              `Se retiró la asignación de ${porRetirar.trabajador?.nombre} conservando el historial.`
            );
            setPorRetirar(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

export default function ReemplazosAsistenciaPage() {
  const { usuario } = useSesion();
  const puedeEditar = puedeGestionar(usuario?.rol);
  const [transmisionId, setTransmisionId] = useState(null);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/personal", texto: "Personal y asignaciones" }}
        eyebrow="Requisitos 2.5 a 2.7"
        titulo="Reemplazos y asistencia"
        descripcion="Gestiona reemplazos, retiros sin reemplazo, control de asistencia y cámaras utilizadas por transmisión."
        extra={<Badge tono="info">{puedeEditar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Card titulo="Transmisión">
        <div className="ui-filtros">
          <SelectorTransmision valor={transmisionId} onCambiar={setTransmisionId} />
        </div>
      </Card>

      {transmisionId ? (
        <AsistenciaDeTransmision
          key={transmisionId}
          transmisionId={transmisionId}
          puedeEditar={puedeEditar}
        />
      ) : (
        <p className="ui-vacio">
          Elige una transmisión para gestionar reemplazos, retiros y asistencia.
        </p>
      )}
    </section>
  );
}