// M2 · Registro y actualización de trabajadores (RF 2.1). Lo usa TrabajadoresYDisponibilidadPage. Llama a trabajadorService.
import { useState } from "react";
import {
  listarTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
} from "../../../services/trabajadorService";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { ROLES_DISPONIBLES, ETIQUETAS_ROL, normalizarRoles } from "../personal.utils";

const FORM_VACIO = {
  rut: "",
  nombre: "",
  telefono: "",
  email: "",
  roles: [],
  activo: true,
};

export default function TrabajadoresPanel({ puedeEditar }) {
  const { datos, cargando, error, recargar } = useFetch(listarTrabajadores);
  const accion = useAccion();
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const trabajadores = datos ?? [];

  function alternarRol(rolValor) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(rolValor)
        ? prev.roles.filter((r) => r !== rolValor)
        : [...prev.roles, rolValor],
    }));
  }

  function iniciarEdicion(trabajador) {
    setEditandoId(trabajador.id);
    setForm({
      rut: trabajador.rut || "",
      nombre: trabajador.nombre || "",
      telefono: trabajador.telefono || "",
      email: trabajador.email || "",
      roles: normalizarRoles(trabajador.roles),
      activo: trabajador.activo ?? true,
    });
    setErrorValidacion("");
    setMensaje("");
    accion.limpiarError();
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrorValidacion("");
    accion.limpiarError();
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setErrorValidacion("");
    setMensaje("");

    if (!form.rut.trim() || !form.nombre.trim() || !form.telefono.trim()) {
      setErrorValidacion("Debes completar el RUT, el nombre y el teléfono del trabajador.");
      return;
    }

    if (form.roles.length === 0) {
      setErrorValidacion("Debes seleccionar al menos un rol para el trabajador.");
      return;
    }

    const payload = {
      rut: form.rut.trim(),
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim() || null,
      roles: form.roles,
      activo: form.activo,
    };

    const guardado = await accion.ejecutar(() =>
      editandoId ? actualizarTrabajador(editandoId, payload) : crearTrabajador(payload)
    );

    if (!guardado) return;

    setMensaje(
      editandoId
        ? "Ficha del trabajador actualizada correctamente."
        : "Trabajador registrado correctamente."
    );
    setEditandoId(null);
    setForm(FORM_VACIO);
    recargar();
  }

  return (
    <div className="ui-pagina">
      <Alerta tipo="exito">{mensaje}</Alerta>

      {puedeEditar && (
        <Card titulo={editandoId ? "Editar ficha del trabajador" : "Incorporar nuevo trabajador"}>
          <form onSubmit={manejarSubmit}>
            <fieldset disabled={accion.guardando} className="ui-fieldset">
              <div className="ui-formulario">
                <Campo etiqueta="RUT (sin puntos) *">
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={form.rut}
                    onChange={(e) => setForm({ ...form, rut: e.target.value })}
                    placeholder="Ej: 12345678-9"
                  />
                </Campo>

                <Campo etiqueta="Nombre *">
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                  />
                </Campo>

                <Campo etiqueta="Teléfono *">
                  <input
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Ej: +56912345678"
                  />
                </Campo>

                <Campo etiqueta="Correo (opcional)">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Ej: juan@correo.cl"
                  />
                </Campo>
              </div>

              <h3 className="ui-subtitulo">Roles que puede desempeñar *</h3>
              <div className="ui-botones">
                {ROLES_DISPONIBLES.map((rol) => (
                  <label key={rol.valor} className="ui-casilla">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(rol.valor)}
                      onChange={() => alternarRol(rol.valor)}
                    />
                    {rol.etiqueta}
                  </label>
                ))}
              </div>

              {editandoId && (
                <label className="ui-casilla ui-casilla-separada">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  Trabajador activo (habilitado para disponibilidad y transmisiones)
                </label>
              )}
            </fieldset>

            <Alerta tipo="error">{errorValidacion || accion.error}</Alerta>
            <div className="ui-botones">
              <Boton type="submit" cargando={accion.guardando}>
                {editandoId ? "Guardar cambios" : "Guardar registro"}
              </Boton>
              {editandoId && (
                <Boton variante="secundario" onClick={cancelarEdicion} disabled={accion.guardando}>
                  Cancelar
                </Boton>
              )}
            </div>
          </form>
        </Card>
      )}

      <Card
        titulo={`Trabajadores registrados (${trabajadores.length})`}
        acciones={
          <Boton variante="secundario" onClick={recargar} disabled={cargando}>
            Actualizar
          </Boton>
        }
      >
        <Alerta tipo="error">{error}</Alerta>
        {cargando ? (
          <p role="status">Cargando trabajadores…</p>
        ) : (
          <DataTable
            titulo="Trabajadores registrados"
            datos={trabajadores}
            vacio="No hay trabajadores registrados todavía."
            columnas={[
              { titulo: "RUT", campo: "rut" },
              {
                titulo: "Nombre",
                render: (t) => (
                  <>
                    <strong>{t.nombre}</strong>
                    {t.email && <small>{t.email}</small>}
                  </>
                ),
              },
              { titulo: "Teléfono", render: (t) => t.telefono || "—" },
              {
                titulo: "Roles habilitados",
                render: (t) => {
                  const lista = normalizarRoles(t.roles);
                  if (!lista.length) return "—";
                  return lista.map((r) => (
                    <Badge key={r} tono="info">
                      {ETIQUETAS_ROL[r] || r}
                    </Badge>
                  ));
                },
              },
              {
                titulo: "Estado",
                render: (t) => (
                  <Badge tono={t.activo ? "exito" : "neutro"}>
                    {t.activo ? "Activo" : "Inactivo"}
                  </Badge>
                ),
              },
              ...(puedeEditar
                ? [
                    {
                      titulo: "Acción",
                      render: (t) => (
                        <Boton
                          variante="secundario"
                          onClick={() => iniciarEdicion(t)}
                          aria-label={`Editar ${t.nombre}`}
                        >
                          Editar
                        </Boton>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Card>
    </div>
  );
}