// Pantalla de registro y gestión de trabajadores (RF-10).
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import {
  listarTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
} from "../../services/trabajadorService";

const ROLES_DISPONIBLES = [
  { valor: "CAMARA", etiqueta: "Cámara" },
  { valor: "AUDIO", etiqueta: "Audio" },
  { valor: "OPERADOR_SWITCH", etiqueta: "Operador de switch" },
  { valor: "INSTALACION_TECNICA", etiqueta: "Instalación técnica" },
  { valor: "RELATOR", etiqueta: "Relator" },
];

const ETIQUETAS_ROL = Object.fromEntries(
  ROLES_DISPONIBLES.map((r) => [r.valor, r.etiqueta])
);

const FORMULARIO_VACIO = {
  rut: "",
  nombre: "",
  telefono: "",
  email: "",
  roles: [],
  activo: true,
};

function TrabajadoresPage() {
  const { usuario } = useSesion();
  const puedeEditar =
    usuario?.rol === "DUENO" || usuario?.rol === "ADMIN_DESARROLLO";

  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      const lista = await listarTrabajadores();
      setTrabajadores(lista);
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de trabajadores");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function alternarRol(rolValor) {
    setForm((prev) => {
      const yaEsta = prev.roles.includes(rolValor);
      return {
        ...prev,
        roles: yaEsta
          ? prev.roles.filter((r) => r !== rolValor)
          : [...prev.roles, rolValor],
      };
    });
  }

  function iniciarEdicion(trabajador) {
    const rolesNormalizados = Array.isArray(trabajador.roles)
      ? trabajador.roles.map((r) => (typeof r === "string" ? r : r.rolTecnico?.nombre)).filter(Boolean)
      : [];

    setEditandoId(trabajador.id);
    setForm({
      rut: trabajador.rut || "",
      nombre: trabajador.nombre || "",
      telefono: trabajador.telefono || "",
      email: trabajador.email || "",
      roles: rolesNormalizados,
      activo: trabajador.activo ?? true,
    });
    setError("");
    setMensaje("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORMULARIO_VACIO);
    setError("");
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!form.rut.trim() || !form.nombre.trim() || !form.telefono.trim()) {
      setError("Debes completar el RUT, el nombre y el teléfono del trabajador.");
      return;
    }

    if (form.roles.length === 0) {
      setError("Debes seleccionar al menos un rol para el trabajador.");
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        rut: form.rut.trim(),
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        roles: form.roles,
        activo: form.activo,
      };

      if (editandoId) {
        await actualizarTrabajador(editandoId, payload);
        setMensaje("Ficha del trabajador actualizada correctamente.");
      } else {
        await crearTrabajador(payload);
        setMensaje("Trabajador registrado correctamente.");
      }

      setEditandoId(null);
      setForm(FORMULARIO_VACIO);
      await cargarDatos();
    } catch (err) {
      setError(err.message || "Error al guardar el trabajador");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Registro de Trabajadores
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Incorporación de personal técnico y asignación de roles habilitados para transmisiones.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          style={{
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          {mensaje}
        </div>
      )}

      {puedeEditar && (
        <form
          onSubmit={manejarSubmit}
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem", marginTop: 0 }}>
            {editandoId ? "Editar ficha del trabajador" : "Incorporar nuevo trabajador"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                RUT (sin puntos) *
              </label>
              <input
                type="text"
                required
                maxLength={12}
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="Ej: 12345678-9"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Nombre *
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Teléfono *
              </label>
              <input
                type="text"
                required
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: +56912345678"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Correo (opcional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ej: juan@correo.cl"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
              Roles que puede desempeñar (selecciona al menos uno) *
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {ROLES_DISPONIBLES.map((rol) => (
                <label
                  key={rol.valor}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: form.roles.includes(rol.valor) ? "#dbeafe" : "#ffffff",
                    border: "1px solid #93c5fd",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "20px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.roles.includes(rol.valor)}
                    onChange={() => alternarRol(rol.valor)}
                  />
                  {rol.etiqueta}
                </label>
              ))}
            </div>
          </div>

          {editandoId && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Trabajador en estado Activo (habilitado para disponibilidad y transmisiones)
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="submit"
              disabled={guardando}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar registro"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                style={{
                  backgroundColor: "#e2e8f0",
                  color: "#1e293b",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {cargando ? (
        <p>Cargando trabajadores...</p>
      ) : trabajadores.length === 0 ? (
        <p>No hay trabajadores registrados todavía.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", textAlign: "left" }}>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>RUT</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Nombre</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Teléfono</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Roles habilitados</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Estado</th>
              {puedeEditar && (
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Acción</th>
              )}
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t) => {
              const listaRoles = Array.isArray(t.roles)
                ? t.roles.map((r) => (typeof r === "string" ? r : r.rolTecnico?.nombre)).filter(Boolean)
                : [];
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem" }}>{t.rut}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "500" }}>{t.nombre}</td>
                  <td style={{ padding: "0.75rem" }}>{t.telefono || "—"}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {listaRoles.map((r) => (
                        <span
                          key={r}
                          style={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "0.8rem",
                            padding: "0.15rem 0.55rem",
                            borderRadius: "12px",
                          }}
                        >
                          {ETIQUETAS_ROL[r] || r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      style={{
                        color: t.activo ? "#1e40af" : "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {puedeEditar && (
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(t)}
                        style={{
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrabajadoresPage;