// Pantalla unificada de Reemplazos (RF-14), Retiros (RF-15) y Asistencia / Cámaras (RF-16).
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import { listarTransmisiones } from "../../services/transmisionService";
import {
  obtenerContextoAsignacion,
  reemplazarAsignacion,
  retirarAsignacion,
  registrarAsistencia,
  registrarCamarasUtilizadas,
} from "../../services/asignacionService";

const ETIQUETAS_ROL = {
  CAMARA: "Cámara",
  AUDIO: "Audio",
  OPERADOR_SWITCH: "Operador de switch",
  INSTALACION_TECNICA: "Instalación técnica",
  RELATOR: "Relator",
};

const ETIQUETAS_ASISTENCIA = {
  PENDIENTE: "Pendiente",
  ASISTIO: "Asistió",
  NO_ASISTIO: "No asistió",
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

  // RF-16: Cámaras efectivamente utilizadas
  const [camarasInput, setCamarasInput] = useState("");

  // RF-14: Estado del formulario de reemplazo
  const [asignacionAReemplazar, setAsignacionAReemplazar] = useState(null);
  const [nuevoTrabajadorId, setNuevoTrabajadorId] = useState("");
  const [rolesReemplazo, setRolesReemplazo] = useState([]);
  const [porcentajeReemplazo, setPorcentajeReemplazo] = useState("");
  const [motivoReemplazo, setMotivoReemplazo] = useState("");

  // RF-15: Estado del formulario de retiro sin reemplazo
  const [asignacionARetirar, setAsignacionARetirar] = useState(null);
  const [motivoRetiro, setMotivoRetiro] = useState("");

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarEventos() {
      try {
        setCargando(true);
        const lista = await listarTransmisiones();
        const arr = Array.isArray(lista) ? lista : [];
        setTransmisiones(arr);
        const primera =
          arr.find((t) => t.estado === "CONFIRMADA" || t.estado === "REALIZADA") ||
          arr[0];
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
      setCamarasInput(
        datos.transmision?.camarasUtilizadas !== null &&
          datos.transmision?.camarasUtilizadas !== undefined
          ? String(datos.transmision.camarasUtilizadas)
          : String(datos.transmision?.cantidadCamaras ?? "")
      );
    } catch (err) {
      setError(err.message || "Error al cargar asignaciones de la transmisión");
    }
  }

  useEffect(() => {
    if (transmisionId) {
      cargarDetalle(transmisionId);
      cerrarPaneles();
    }
  }, [transmisionId]);

  function cerrarPaneles() {
    setAsignacionAReemplazar(null);
    setNuevoTrabajadorId("");
    setRolesReemplazo([]);
    setPorcentajeReemplazo("");
    setMotivoReemplazo("");
    setAsignacionARetirar(null);
    setMotivoRetiro("");
  }

  function iniciarReemplazo(asignacion) {
    cerrarPaneles();
    setAsignacionAReemplazar(asignacion);
    setRolesReemplazo(asignacion.roles || []);
    setPorcentajeReemplazo(
      asignacion.porcentajeComision !== null &&
        asignacion.porcentajeComision !== undefined
        ? String(asignacion.porcentajeComision)
        : ""
    );
    setError("");
    setMensaje("");
  }

  function iniciarRetiro(asignacion) {
    cerrarPaneles();
    setAsignacionARetirar(asignacion);
    setMotivoRetiro("");
    setError("");
    setMensaje("");
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

    if (!motivoReemplazo.trim() || motivoReemplazo.trim().length < 3) {
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
        motivo: motivoReemplazo.trim(),
        roles: rolesReemplazo,
        porcentajeComision:
          porcentajeReemplazo !== "" ? Number(porcentajeReemplazo) : null,
        aceptarAdvertencia,
      });

      setMensaje(
        `Reemplazo de ${asignacionAReemplazar.trabajador?.nombre} registrado correctamente.`
      );
      cerrarPaneles();
      await cargarDetalle(transmisionId);
    } catch (err) {
      setError(err.message || "No se pudo realizar el reemplazo");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarRetiro(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!asignacionARetirar) return;
    if (!motivoRetiro.trim() || motivoRetiro.trim().length < 3) {
      setError("Debes ingresar el motivo del retiro (mínimo 3 caracteres).");
      return;
    }

    try {
      setGuardando(true);
      await retirarAsignacion(asignacionARetirar.id, motivoRetiro.trim());
      setMensaje(
        `Se retiró la asignación de ${asignacionARetirar.trabajador?.nombre} conservando el historial.`
      );
      cerrarPaneles();
      await cargarDetalle(transmisionId);
    } catch (err) {
      setError(err.message || "No se pudo retirar la asignación");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarAsistenciaFila(asignacionId, nuevaAsistencia) {
    setError("");
    setMensaje("");
    try {
      await registrarAsistencia(asignacionId, nuevaAsistencia);
      setMensaje(
        `Asistencia actualizada a "${ETIQUETAS_ASISTENCIA[nuevaAsistencia]}".`
      );
      await cargarDetalle(transmisionId);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la asistencia");
    }
  }

  async function guardarCamarasEvento(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    const valor = camarasInput === "" ? null : Number(camarasInput);
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) {
      setError("Ingresa un número válido de cámaras utilizadas.");
      return;
    }

    try {
      await registrarCamarasUtilizadas(transmisionId, valor);
      setMensaje("Cantidad de cámaras utilizadas guardada correctamente.");
      await cargarDetalle(transmisionId);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cantidad de cámaras");
    }
  }

  const historialBajas = contexto?.historialAsignaciones || [];

  return (
    <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Reemplazos, Retiros y Registro de Asistencia
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Gestión de reemplazos (RF-14), retiro de asignaciones sin reemplazo (RF-15) y control de asistencia y cámaras utilizadas (RF-16).
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

      {/* Selector de transmisión y registro de cámaras utilizadas (RF-16) */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1rem",
          alignItems: "end",
        }}
      >
        <div>
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

        {contexto && (
          <form onSubmit={guardarCamarasEvento}>
            <label style={{ display: "block", fontWeight: "600", color: "#1e3a8a", marginBottom: "0.35rem" }}>
              Cámaras utilizadas (Cotizadas: {contexto.transmision.cantidadCamaras}):
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                min="0"
                max={contexto.transmision.cantidadCamaras}
                disabled={!puedeEditar}
                value={camarasInput}
                onChange={(e) => setCamarasInput(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #93c5fd" }}
              />
              {puedeEditar && (
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.5rem 0.85rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Guardar
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : !contexto ? (
        <p>Selecciona una transmisión.</p>
      ) : (
        <>
          {/* Panel de Reemplazo (RF-14) */}
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
                Reemplazar a: {asignacionAReemplazar.trabajador?.nombre} (RF-14)
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
                    placeholder="Hereda % anterior"
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
                  value={motivoReemplazo}
                  onChange={(e) => setMotivoReemplazo(e.target.value)}
                  placeholder="Ej: Avisó imprevisto médico / problema de transporte"
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
                  onClick={cerrarPaneles}
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

          {/* Panel de Retiro sin reemplazo (RF-15) */}
          {asignacionARetirar && puedeEditar && (
            <form
              onSubmit={confirmarRetiro}
              style={{
                backgroundColor: "#fff1f2",
                border: "2px solid #e11d48",
                borderRadius: "8px",
                padding: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ color: "#9f1239", fontSize: "1.15rem", marginTop: 0 }}>
                Retirar asignación de: {asignacionARetirar.trabajador?.nombre} (RF-15)
              </h2>
              <p style={{ color: "#881337", marginTop: 0, fontSize: "0.92rem" }}>
                El trabajador dejará de estar activo en esta transmisión sin asignar un reemplazante, pero se conservará el registro en el historial.
              </p>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "600", color: "#881337", marginBottom: "0.25rem" }}>
                  Motivo del retiro *
                </label>
                <input
                  type="text"
                  required
                  value={motivoRetiro}
                  onChange={(e) => setMotivoRetiro(e.target.value)}
                  placeholder="Ej: Reducción de cámaras solicitada por el cliente / baja de última hora"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #fda4af" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    backgroundColor: "#e11d48",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {guardando ? "Retirando..." : "Confirmar retiro de asignación"}
                </button>
                <button
                  type="button"
                  onClick={cerrarPaneles}
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
            </form>
          )}

          {/* Tabla principal: Personal activo, Asistencia (RF-16), Reemplazar (RF-14) y Retirar (RF-15) */}
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem" }}>
            Personal activo y control de asistencia ({contexto.asignaciones.length})
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
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Trazabilidad</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Asistencia (RF-16)</th>
                  {puedeEditar && (
                    <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                      Acciones (RF-14 / RF-15)
                    </th>
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
                    <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "#1e40af" }}>
                      {a.reemplazaANombre
                        ? `Reemplazó a ${a.reemplazaANombre}`
                        : "Asignación original"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {puedeEditar ? (
                        <select
                          value={a.asistencia}
                          onChange={(e) => cambiarAsistenciaFila(a.id, e.target.value)}
                          style={{
                            padding: "0.35rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #93c5fd",
                            fontWeight: "600",
                            backgroundColor:
                              a.asistencia === "ASISTIO"
                                ? "#dcfce7"
                                : a.asistencia === "NO_ASISTIO"
                                ? "#fee2e2"
                                : "#f8fafc",
                            color:
                              a.asistencia === "ASISTIO"
                                ? "#166534"
                                : a.asistencia === "NO_ASISTIO"
                                ? "#991b1b"
                                : "#334155",
                          }}
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="ASISTIO">Asistió</option>
                          <option value="NO_ASISTIO">No asistió</option>
                        </select>
                      ) : (
                        <span>{ETIQUETAS_ASISTENCIA[a.asistencia] || a.asistencia}</span>
                      )}
                    </td>
                    {puedeEditar && (
                      <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => iniciarReemplazo(a)}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Reemplazar
                        </button>
                        <button
                          type="button"
                          onClick={() => iniciarRetiro(a)}
                          style={{
                            backgroundColor: "#e11d48",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Retirar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Historial de Reemplazos (RF-14) y Retiros (RF-15) */}
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem" }}>
            Historial de Reemplazos y Retiros Registrados ({historialBajas.length})
          </h2>

          {historialBajas.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No se han registrado reemplazos ni retiros en esta transmisión.
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
                    Trabajador
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Estado
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Reemplazado por
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Roles que tenía
                  </th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>
                    Motivo registrado
                  </th>
                </tr>
              </thead>
              <tbody>
                {historialBajas.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                      {h.trabajador?.nombre}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          backgroundColor:
                            h.estado === "REEMPLAZADO" ? "#dbeafe" : "#ffe4e6",
                          color: h.estado === "REEMPLAZADO" ? "#1e40af" : "#9f1239",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                        }}
                      >
                        {h.estado}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#1d4ed8", fontWeight: "600" }}>
                      {h.reemplazadaPorNombre || "Sin reemplazo"}
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