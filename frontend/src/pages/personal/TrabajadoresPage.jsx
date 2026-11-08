// Pantalla de gestión de trabajadores y sus roles técnicos (RF-10).
// La muestra App.jsx (o el menú principal) y llama a services/trabajadorService.js.
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import {
  listarTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
} from "../../services/trabajadorService";

const ROLES_DISPONIBLES = [
  "DIRECTOR",
  "CAMAROGRAFO",
  "SONIDISTA",
  "PRODUCTOR",
  "OPERADOR_REPLAY",
  "TECNICO_TRANSMISION",
];

const FORMULARIO_VACIO = {
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  roles: [],
  activo: true,
};

function TrabajadoresPage() {
  const { usuario } = useSesion();
  const esDueno = usuario?.rol === "DUENO";

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

  function alternarRol(rol) {
    setForm((prev) => {
      const yaEsta = prev.roles.includes(rol);
      return {
        ...prev,
        roles: yaEsta
          ? prev.roles.filter((r) => r !== rol)
          : [...prev.roles, rol],
      };
    });
  }

  function iniciarEdicion(trabajador) {
    setEditandoId(trabajador.id);
    setForm({
      nombre: trabajador.nombre || "",
      rut: trabajador.rut || "",
      telefono: trabajador.telefono || "",
      email: trabajador.email || "",
      roles: trabajador.roles || [],
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

    try {
      setGuardando(true);
      const payload = {
        nombre: form.nombre,
        rut: form.rut,
        telefono: form.telefono || null,
        email: form.email || null,
        roles: form.roles,
        activo: form.activo,
      };

      if (editandoId) {
        await actualizarTrabajador(editandoId, payload);
        setMensaje("Trabajador actualizado correctamente");
      } else {
        await crearTrabajador(payload);
        setMensaje("Trabajador registrado correctamente");
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
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Personal y Roles Tcnicos
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Registro de trabajadores de la empresa y las funciones que cada uno sabe desempeñar.
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

      {esDueno && (
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
            {editandoId ? "Editar trabajador" : "Registrar nuevo trabajador"}
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
                Nombre completo *
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
                RUT *
              </label>
              <input
                type="text"
                required
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="Ej: 18.345.678-9"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Teléfono
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: +56912345678"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Correo electrónico
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
              Roles técnicos que desempeña (selecciona al menos uno) *
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {ROLES_DISPONIBLES.map((rol) => (
                <label
                  key={rol}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: form.roles.includes(rol) ? "#dbeafe" : "#ffffff",
                    border: "1px solid #93c5fd",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "20px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.roles.includes(rol)}
                    onChange={() => alternarRol(rol)}
                  />
                  {rol}
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
                Trabajador activo en la empresa
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
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar trabajador"}
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
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Nombre</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>RUT</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Contacto</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Roles</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Estado</th>
              {esDueno && (
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Acción</th>
              )}
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: "500" }}>{t.nombre}</td>
                <td style={{ padding: "0.75rem" }}>{t.rut}</td>
                <td style={{ padding: "0.75rem" }}>
                  {t.telefono || t.email ? (
                    <>
                      {t.telefono && <div>{t.telefono}</div>}
                      {t.email && <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{t.email}</div>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {t.roles.map((r) => (
                      <span
                        key={r}
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "0.8rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "12px",
                        }}
                      >
                        {r}
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
                {esDueno && (
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrabajadoresPage;
