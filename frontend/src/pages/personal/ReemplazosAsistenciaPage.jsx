// Pantalla de reemplazo de trabajadores asignados (RF-14) con conservación de historial.
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import { listarTransmisiones } from "../../services/transmisionService";
import {
  obtenerContextoAsignacion,
  reemplazarAsignacion,
} from "../../services/asignacionService";

const ETIQUETAS_ROL = {
  CAMARA: "Cámara",
  AUDIO: "Audio",
  OPERADOR_SWITCH: "Operador de switch",
  INSTALACION_TECNICA: "Instalación técnica",
  RELATOR: "Relator",
};

function formatearFechaHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ReemplazosAsistenciaPage() {
  const { usuario } = useSesion();
  const puedeEditar =
    usuario?.rol === "DUENO" || usuario?.rol === "ADMIN_DESARROLLO";

  const [transmisiones, setTransmisiones] = useState([]);
  const [transmisionId, setTransmisionId] = useState("");
  const [contexto, setContexto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Estado del formulario de reemplazo (RF-14)
  const [asignacionAReemplazar, setAsignacionAReemplazar] = useState(null);
  const [nuevoTrabajadorId, setNuevoTrabajadorId] = useState("");
  const [rolesReemplazo, setRolesReemplazo] = useState([]);
  const [porcentajeReemplazo, setPorcentajeReemplazo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarEventos() {
      try {
        setCargando(true);
        const lista = await listarTransmisiones();
        const arr = Array.isArray(lista) ? lista : [];
        setTransmisiones(arr);
        const primera =
          arr.find((t) => t.estado === "CONFIRMADA") || arr[0];
        if (primera) {
          setTransmisionId(String(primera.id));
        }
      } catch (err) {
        setError(err.message || "Error al cargar transmisiones");
      } finally {
        setCargando(false);
      }
    }
    cargarEventos();
  }, []);

  async function cargarDetalle(idEvento = transmisionId) {
    if (!idEvento) return;
    try {
      setError("");
      const datos = await obtenerContextoAsignacion(idEvento);
      setContexto(datos);
    } catch (err) {
      setError(err.message || "Error al cargar asignaciones de la transmisión");
    }
  }

  useEffect(() => {
    if (transmisionId) {
      cargarDetalle(transmisionId);
      cancelarReemplazo();
    }
  }, [transmisionId]);

  function iniciarReemplazo(asignacion) {
    setAsignacionAReemplazar(asignacion);
    setNuevoTrabajadorId("");
    setRolesReemplazo(asignacion.roles || []);
    setPorcentajeReemplazo(
      asignacion.porcentajeComision !== null &&
        asignacion.porcentajeComision !== undefined
        ? String(asignacion.porcentajeComision)
        : ""
    );
    setMotivo("");
    setError("");
    setMensaje("");
  }

  function cancelarReemplazo() {
    setAsignacionAReemplazar(null);
    setNuevoTrabajadorId("");
    setRolesReemplazo([]);
    setPorcentajeReemplazo("");
    setMotivo("");
  }

  const candidatoSeleccionado = contexto?.candidatos?.find(
    (c) => String(c.id) === String(nuevoTrabajadorId)
  );

  function alternarRol(rol) {
    setRolesReemplazo((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]
    );
  }

  async function confirmarReemplazo(aceptarAdvertencia = false) {
    setError("");
    setMensaje("");

    if (!asignacionAReemplazar || !nuevoTrabajadorId) {
      setError("Debes seleccionar al trabajador reemplazante.");
      return;
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setError("Debes ingresar el motivo del reemplazo (mínimo 3 caracteres).");
      return;
    }

    if (rolesReemplazo.length === 0) {
      setError("El trabajador reemplazante debe asumir al menos un rol.");
      return;
    }

    try {
      setGuardando(true);
      await reemplazarAsignacion(asignacionAReemplazar.id, {
        nuevoTrabajadorId: Number(nuevoTrabajadorId),
        motivo: motivo.trim(),
        roles: rolesReemplazo,
        porcentajeComision:
          porcentajeReemplazo !== "" ? Number(porcentajeReemplazo) : null,
        aceptarAdvertencia,
      });

      setMensaje(
        `Se registró el reemplazo de ${asignacionAReemplazar.trabajador?.nombre} correctamente, conservando el historial.`
      );
      cancelarReemplazo();
      await cargarDetalle(transmisionId);
    } catch (err) {
      setError(err.message || "No se pudo realizar el reemplazo");
    } finally {
      setGuardando(false);
    }
  }

  const historialReemplazos =
    contexto?.historialAsignaciones?.filter((h) => h.estado === "REEMPLAZADO") || [];

  return (
    <div style={{ maxWidth: "1020px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Reemplazo de Trabajadores en Transmisiones (RF-14)
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Sustituye a un trabajador que no podrá participar por otro trabajador activo, registrando el motivo y conservando la trazabilidad histórica.
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

      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <label style={{ display: "block", fontWeight: "600", color: "#1e3a8a", marginBottom: "0.35rem" }}>
          Seleccionar transmisión:
        </label>
        <select
          value={transmisionId}
          onChange={(e) => setTransmisionId(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #93c5fd" }}
        >
          <option value="">Selecciona una transmisión...</option>
          {transmisiones.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.estado}] {t.nombreEvento} — {formatearFechaHora(t.inicio)} ({t.lugar})
            </option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : !contexto ? (
        <p>Selecciona una transmisión.</p>
      ) : (
        <>
          {/* Modal / Panel de Reemplazo cuando se selecciona un trabajador */}
          {asignacionAReemplazar && puedeEditar && (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "2px solid #2563eb",
                borderRadius: "8px",
                padding: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem", marginTop: 0 }}>
                Reemplazar a: {asignacionAReemplazar.trabajador?.nombre} (Roles actuales:{" "}
                {asignacionAReemplazar.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")})
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                    Seleccionar trabajador reemplazante (Activo) *
                  </label>
                  <select
                    value={nuevoTrabajadorId}
                    onChange={(e) => {
                      const idSel = e.target.value;
                      setNuevoTrabajadorId(idSel);
                      const cand = contexto.candidatos.find((c) => String(c.id) === String(idSel));
                      if (cand) {
                        // Preseleccionar los roles de la asignación original que el reemplazante tenga habilitados
                        const comunes = asignacionAReemplazar.roles.filter((r) =>
                          cand.roles.includes(r)
                        );
                        setRolesReemplazo(comunes.length > 0 ? comunes : cand.roles.slice(0, 1));
                      }
                    }}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
                  >
                    <option value="">Selecciona al reemplazante...</option>
                    {contexto.candidatos
                      .filter((c) => c.id !== asignacionAReemplazar.trabajadorId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.disponible ? "★ [DISPONIBLE] " : "⚠ [CON ADVERTENCIA] "}
                          {c.nombre} — Roles ficha: {c.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                    % Comisión para el reemplazante
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={porcentajeReemplazo}
                    onChange={(e) => setPorcentajeReemplazo(e.target.value)}
                    placeholder="Hereda % anterior si se deja igual"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
                  />
                </div>
              </div>

              {candidatoSeleccionado && (
                <>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.35rem" }}>
                      Roles que asumirá el reemplazante (según su ficha) *
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      {candidatoSeleccionado.roles.map((rol) => (
                        <label
                          key={rol}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            backgroundColor: rolesReemplazo.includes(rol) ? "#dbeafe" : "#ffffff",
                            border: "1px solid #93c5fd",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={rolesReemplazo.includes(rol)}
                            onChange={() => alternarRol(rol)}
                          />
                          {ETIQUETAS_ROL[rol] || rol}
                        </label>
                      ))}
                    </div>
                  </div>

                  {candidatoSeleccionado.advertencias.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fcd34d",
                        color: "#92400e",
                        padding: "0.75rem 1rem",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                      }}
                    >
                      <strong>Advertencias del reemplazante:</strong>
                      <ul style={{ margin: "0.35rem 0 0 1.2rem" }}>
                        {candidatoSeleccionado.advertencias.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                  Motivo del reemplazo *
                </label>
                <input
                  type="text"
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Avisó imprevisto médico / choque de horario de última hora"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {candidatoSeleccionado?.advertencias?.length > 0 ? (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => confirmarReemplazo(true)}
                    style={{
                      backgroundColor: "#d97706",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {guardando ? "Guardando..." : "Aceptar advertencia y confirmar reemplazo"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => confirmarReemplazo(false)}
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
                    {guardando ? "Guardando..." : "Confirmar reemplazo"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={cancelarReemplazo}
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
              </div>
            </div>
          )}

          {/* Tabla de personal actualmente asignado */}
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem" }}>
            Personal activo asignado a la transmisión ({contexto.asignaciones.length})
          </h2>

          {contexto.asignaciones.length === 0 ? (
            <p>No hay trabajadores activos asignados en esta transmisión.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                marginBottom: "2rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Trabajador</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Roles</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>% Comisión</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Trazabilidad</th>
                  {puedeEditar && (
                    <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {contexto.asignaciones.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "600" }}>
                      {a.trabajador?.nombre}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {a.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {a.porcentajeComision ? `${a.porcentajeComision}%` : "Sin definir"}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "#1e40af" }}>
                      {a.reemplazaANombre
                        ? `Reemplazó a ${a.reemplazaANombre}`
                        : "Asignación original"}
                    </td>
                    {puedeEditar && (
                      <td style={{ padding: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => iniciarReemplazo(a)}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.35rem 0.85rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Reemplazar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Historial de trabajadores reemplazados en la transmisión */}
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem" }}>
            Historial de Reemplazos Registrados ({historialReemplazos.length})
          </h2>

          {historialReemplazos.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No se han registrado reemplazos en esta transmisión.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#e2e8f0", color: "#1e293b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Trabajador Reemplazado
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Reemplazado por
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Roles que tenía
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Motivo del reemplazo
                  </th>
                </tr>
              </thead>
              <tbody>
                {historialReemplazos.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                      {h.trabajador?.nombre}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#1d4ed8", fontWeight: "600" }}>
                      {h.reemplazadaPorNombre || "—"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {h.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#475569" }}>
                      {h.motivo || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default ReemplazosAsistenciaPage;