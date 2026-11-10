// Pantalla de registro y actualización de disponibilidad horaria (RF-11).
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import { listarTrabajadores } from "../../services/trabajadorService";
import {
  listarDisponibilidades,
  crearDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
} from "../../services/disponibilidadService";

const FORM_VACIO = {
  trabajadorId: "",
  fecha: "",
  horaInicio: "09:00",
  horaTermino: "18:00",
};

function formatearFechaHora(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function extraerFechaYHora(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${min}` };
}

function obtenerTextoRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return "Sin roles";
  return roles
    .map((r) => (typeof r === "string" ? r : r.rolTecnico?.nombre || r.nombre || ""))
    .filter(Boolean)
    .join(", ");
}

function DisponibilidadPage() {
  const { usuario } = useSesion();
  const puedeEditar =
    usuario?.rol === "DUENO" || usuario?.rol === "ADMIN_DESARROLLO";

  const [trabajadores, setTrabajadores] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [filtroTrabajador, setFiltroTrabajador] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargarDatos(idFiltro = filtroTrabajador) {
    try {
      setCargando(true);
      setError("");
      const [listaTrabajadores, listaBloques] = await Promise.all([
        listarTrabajadores(),
        listarDisponibilidades(idFiltro || undefined),
      ]);
      setTrabajadores(listaTrabajadores);
      setBloques(listaBloques);
    } catch (err) {
      setError(err.message || "Error al cargar la disponibilidad");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

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
    setError("");
    setMensaje("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setError("");
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!form.trabajadorId || !form.fecha || !form.horaInicio || !form.horaTermino) {
      setError("Debes seleccionar un trabajador, fecha, hora de inicio y hora de término.");
      return;
    }

    const inicioIso = new Date(`${form.fecha}T${form.horaInicio}:00`).toISOString();
    const terminoIso = new Date(`${form.fecha}T${form.horaTermino}:00`).toISOString();

    if (new Date(terminoIso) <= new Date(inicioIso)) {
      setError("La hora de término debe ser posterior a la hora de inicio.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        await actualizarDisponibilidad(editandoId, {
          inicio: inicioIso,
          termino: terminoIso,
        });
        setMensaje("Bloque de disponibilidad actualizado correctamente.");
      } else {
        await crearDisponibilidad({
          trabajadorId: Number(form.trabajadorId),
          inicio: inicioIso,
          termino: terminoIso,
        });
        setMensaje("Bloque de disponibilidad registrado correctamente.");
      }

      setEditandoId(null);
      setForm(FORM_VACIO);
      await cargarDatos(filtroTrabajador);
    } catch (err) {
      setError(err.message || "No se pudo guardar el bloque de disponibilidad");
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id) {
    setError("");
    setMensaje("");
    try {
      await eliminarDisponibilidad(id);
      setMensaje("Bloque de disponibilidad eliminado.");
      await cargarDatos(filtroTrabajador);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el bloque");
    }
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Disponibilidad de Trabajadores
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Registro y actualización de días y horarios recibidos por WhatsApp para trabajadores activos.
      </p>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {mensaje && (
        <div style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
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
            {editandoId ? "Editar bloque de disponibilidad" : "Registrar bloque de disponibilidad"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Trabajador (Activo) *
              </label>
              <select
                required
                disabled={Boolean(editandoId)}
                value={form.trabajadorId}
                onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              >
                <option value="">Selecciona un trabajador...</option>
                {trabajadoresActivos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({obtenerTextoRoles(t.roles)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Hora de inicio *
              </label>
              <input
                type="time"
                required
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                Hora de término *
              </label>
              <input
                type="time"
                required
                value={form.horaTermino}
                onChange={(e) => setForm({ ...form, horaTermino: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
              />
            </div>
          </div>

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
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar disponibilidad"}
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

      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <label style={{ fontWeight: "600", color: "#1e3a8a" }}>Filtrar por trabajador:</label>
        <select
          value={filtroTrabajador}
          onChange={(e) => {
            setFiltroTrabajador(e.target.value);
            cargarDatos(e.target.value);
          }}
          style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
        >
          <option value="">Todos los trabajadores</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} {!t.activo ? "(Inactivo)" : ""}
            </option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p>Cargando bloques de disponibilidad...</p>
      ) : bloques.length === 0 ? (
        <p>No hay bloques de disponibilidad registrados.</p>
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
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Trabajador</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Inicio</th>
              <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Término</th>
              {puedeEditar && (
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {bloques.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                  {b.trabajador?.nombre || `#${b.trabajadorId}`}
                </td>
                <td style={{ padding: "0.75rem" }}>{formatearFechaHora(b.inicio)}</td>
                <td style={{ padding: "0.75rem" }}>{formatearFechaHora(b.termino)}</td>
                {puedeEditar && (
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(b)}
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
                    <button
                      type="button"
                      onClick={() => manejarEliminar(b.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
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

export default DisponibilidadPage;