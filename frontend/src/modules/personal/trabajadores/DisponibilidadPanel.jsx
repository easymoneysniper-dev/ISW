// M2 · Disponibilidad horaria de trabajadores (RF 2.2). Lo usa TrabajadoresYDisponibilidadPage. Llama a trabajadorService y disponibilidadService.
import { useCallback, useState } from "react";
import { listarTrabajadores } from "../../../services/trabajadorService";
import {
  listarDisponibilidades,
  crearDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
} from "../../../services/disponibilidadService";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import { fechaHora } from "../../../utils/formato";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { ETIQUETAS_ROL, normalizarRoles, extraerFechaYHora } from "../personal.utils";

const FORM_VACIO = {
  trabajadorId: "",
  fecha: "",
  horaInicio: "09:00",
  horaTermino: "18:00",
};

export default function DisponibilidadPanel({ puedeEditar }) {
  const [filtroTrabajador, setFiltroTrabajador] = useState("");
  const cargar = useCallback(
    () => Promise.all([listarTrabajadores(), listarDisponibilidades(filtroTrabajador || undefined)]),
    [filtroTrabajador]
  );
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const guardarAccion = useAccion();
  const eliminarAccion = useAccion();

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [trabajadores, bloques] = datos ?? [[], []];
  const trabajadoresActivos = trabajadores.filter((t) => t.activo);

  function iniciarEdicion(bloque) {
    const ini = extraerFechaYHora(bloque.inicio);
    const fin = extraerFechaYHora(bloque.termino);
    setEditandoId(bloque.id);
    setForm({
      trabajadorId: String(bloque.trabajadorId),
      fecha: ini.fecha,
      horaInicio: ini.hora,
      horaTermino: fin.hora,
    });
    setErrorValidacion("");
    setMensaje("");
    guardarAccion.limpiarError();
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrorValidacion("");
    guardarAccion.limpiarError();
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setErrorValidacion("");
    setMensaje("");

    if (!form.trabajadorId || !form.fecha || !form.horaInicio || !form.horaTermino) {
      setErrorValidacion("Debes seleccionar un trabajador, fecha, hora de inicio y hora de término.");
      return;
    }

    const inicioIso = new Date(`${form.fecha}T${form.horaInicio}:00`).toISOString();
    const terminoIso = new Date(`${form.fecha}T${form.horaTermino}:00`).toISOString();

    if (new Date(terminoIso) <= new Date(inicioIso)) {
      setErrorValidacion("La hora de término debe ser posterior a la hora de inicio.");
      return;
    }

    const guardado = await guardarAccion.ejecutar(() =>
      editandoId
        ? actualizarDisponibilidad(editandoId, { inicio: inicioIso, termino: terminoIso })
        : crearDisponibilidad({
            trabajadorId: Number(form.trabajadorId),
            inicio: inicioIso,
            termino: terminoIso,
          })
    );

    if (!guardado) return;

    setMensaje(
      editandoId
        ? "Bloque de disponibilidad actualizado correctamente."
        : "Bloque de disponibilidad registrado correctamente."
    );
    setEditandoId(null);
    setForm(FORM_VACIO);
    recargar();
  }

  async function confirmarEliminacion() {
    const bloque = porEliminar;
    const eliminado = await eliminarAccion.ejecutar(() => eliminarDisponibilidad(bloque.id));
    if (!eliminado) return;

    setPorEliminar(null);
    setMensaje("Bloque de disponibilidad eliminado.");
    recargar();
  }

  return (
    <div className="ui-pagina">
      <Alerta tipo="exito">{mensaje}</Alerta>

      {puedeEditar && (
        <Card
          titulo={editandoId ? "Editar bloque de disponibilidad" : "Registrar bloque de disponibilidad"}
        >
          <form onSubmit={manejarSubmit}>
            <fieldset disabled={guardarAccion.guardando} className="ui-fieldset">
              <div className="ui-formulario">
                <Campo etiqueta="Trabajador (activo) *">
                  <select
                    required
                    disabled={Boolean(editandoId)}
                    value={form.trabajadorId}
                    onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                  >
                    <option value="">Selecciona un trabajador…</option>
                    {trabajadoresActivos.map((t) => {
                      const rolesTxt = normalizarRoles(t.roles)
                        .map((r) => ETIQUETAS_ROL[r] || r)
                        .join(", ");
                      return (
                        <option key={t.id} value={t.id}>
                          {t.nombre} ({rolesTxt || "Sin roles"})
                        </option>
                      );
                    })}
                  </select>
                </Campo>

                <Campo etiqueta="Fecha *">
                  <input
                    type="date"
                    required
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Hora de inicio *">
                  <input
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Hora de término *">
                  <input
                    type="time"
                    required
                    value={form.horaTermino}
                    onChange={(e) => setForm({ ...form, horaTermino: e.target.value })}
                  />
                </Campo>
              </div>
            </fieldset>

            <Alerta tipo="error">{errorValidacion || guardarAccion.error}</Alerta>
            <div className="ui-botones">
              <Boton type="submit" cargando={guardarAccion.guardando}>
                {editandoId ? "Guardar cambios" : "Guardar disponibilidad"}
              </Boton>
              {editandoId && (
                <Boton
                  variante="secundario"
                  onClick={cancelarEdicion}
                  disabled={guardarAccion.guardando}
                >
                  Cancelar
                </Boton>
              )}
            </div>
          </form>
        </Card>
      )}

      <Card
        titulo={`Bloques de disponibilidad (${bloques.length})`}
        acciones={
          <Boton variante="secundario" onClick={recargar} disabled={cargando}>
            Actualizar
          </Boton>
        }
      >
        <div className="ui-filtros">
          <Campo etiqueta="Filtrar por trabajador">
            <select
              value={filtroTrabajador}
              onChange={(e) => setFiltroTrabajador(e.target.value)}
            >
              <option value="">Todos los trabajadores</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {!t.activo ? "(Inactivo)" : ""}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        {cargando ? (
          <p role="status">Cargando bloques de disponibilidad…</p>
        ) : (
          <DataTable
            titulo="Bloques de disponibilidad"
            datos={bloques}
            vacio="No hay bloques de disponibilidad registrados."
            columnas={[
              {
                titulo: "Trabajador",
                render: (b) => <strong>{b.trabajador?.nombre || `#${b.trabajadorId}`}</strong>,
              },
              { titulo: "Inicio", render: (b) => fechaHora(b.inicio) },
              { titulo: "Término", render: (b) => fechaHora(b.termino) },
              ...(puedeEditar
                ? [
                    {
                      titulo: "Acciones",
                      render: (b) => (
                        <div className="ui-botones">
                          <Boton variante="secundario" onClick={() => iniciarEdicion(b)}>
                            Editar
                          </Boton>
                          <Boton
                            variante="peligro"
                            onClick={() => {
                              eliminarAccion.limpiarError();
                              setPorEliminar(b);
                            }}
                          >
                            Eliminar
                          </Boton>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Card>

      <Modal
        abierto={porEliminar !== null}
        titulo="Eliminar bloque de disponibilidad"
        onCerrar={() => setPorEliminar(null)}
        acciones={
          <>
            <Boton
              variante="secundario"
              onClick={() => setPorEliminar(null)}
              disabled={eliminarAccion.guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarEliminacion}
              cargando={eliminarAccion.guardando}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        {porEliminar && (
          <>
            <p>
              ¿Eliminar el bloque de{" "}
              <strong>{porEliminar.trabajador?.nombre || `#${porEliminar.trabajadorId}`}</strong>{" "}
              ({fechaHora(porEliminar.inicio)} — {fechaHora(porEliminar.termino)})?
            </p>
            <Alerta tipo="error">{eliminarAccion.error}</Alerta>
          </>
        )}
      </Modal>
    </div>
  );
}