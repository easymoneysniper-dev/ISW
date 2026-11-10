// Pantalla de asignación de trabajadores (RF-12) y definición de comisiones (RF-13).
import { useEffect, useState } from "react";
import { useSesion } from "../../hooks/useSesion";
import { listarTransmisiones } from "../../services/transmisionService";
import {
  obtenerContextoAsignacion,
  crearAsignacion,
  definirComision,
} from "../../services/asignacionService";

const ETIQUETAS_ROL = {
  CAMARA: "Cámara",
  AUDIO: "Audio",
  OPERADOR_SWITCH: "Operador de switch",
  INSTALACION_TECNICA: "Instalación técnica",
  RELATOR: "Relator",
};

function formatearPesos(monto) {
  return Number(monto || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearFechaHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function AsignacionesPage() {
  const { usuario } = useSesion();
  const puedeEditar =
    usuario?.rol === "DUENO" || usuario?.rol === "ADMIN_DESARROLLO";

  const [transmisiones, setTransmisiones] = useState([]);
  const [transmisionId, setTransmisionId] = useState("");
  const [tiempoTrasladoMin, setTiempoTrasladoMin] = useState(60);

  const [contexto, setContexto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Formulario de asignación (RF-12)
  const [trabajadorId, setTrabajadorId] = useState("");
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
  const [porcentajeInicial, setPorcentajeInicial] = useState("");
  const [advertenciasPendientes, setAdvertenciasPendientes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Edición de porcentajes en tabla (RF-13)
  const [porcentajesEditados, setPorcentajesEditados] = useState({});

  useEffect(() => {
    async function cargarEventos() {
      try {
        setCargando(true);
        const lista = await listarTransmisiones();
        const confirmadasPrimero = Array.isArray(lista) ? lista : [];
        setTransmisiones(confirmadasPrimero);
        const primeraConfirmada =
          confirmadasPrimero.find((t) => t.estado === "CONFIRMADA") ||
          confirmadasPrimero[0];
        if (primeraConfirmada) {
          setTransmisionId(String(primeraConfirmada.id));
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar las transmisiones");
      } finally {
        setCargando(false);
      }
    }
    cargarEventos();
  }, []);

  async function cargarDetalleTransmision(idEvento = transmisionId, traslado = tiempoTrasladoMin) {
    if (!idEvento) return;
    try {
      setError("");
      const datos = await obtenerContextoAsignacion(idEvento, traslado);
      setContexto(datos);

      const mapaPct = {};
      for (const a of datos.asignaciones || []) {
        mapaPct[a.id] =
          a.porcentajeComision !== null && a.porcentajeComision !== undefined
            ? String(a.porcentajeComision)
            : "";
      }
      setPorcentajesEditados(mapaPct);
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle de asignaciones");
    }
  }

  useEffect(() => {
    if (transmisionId) {
      cargarDetalleTransmision(transmisionId, tiempoTrasladoMin);
      setTrabajadorId("");
      setRolesSeleccionados([]);
      setAdvertenciasPendientes([]);
    }
  }, [transmisionId]);

  const trabajadorSeleccionado = contexto?.candidatos?.find(
    (c) => String(c.id) === String(trabajadorId)
  );

  function alternarRol(rol) {
    setRolesSeleccionados((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]
    );
  }

  async function enviarAsignacion(aceptarAdvertencia = false) {
    setError("");
    setMensaje("");

    if (!transmisionId || !trabajadorId) {
      setError("Debes seleccionar una transmisión y un trabajador activo.");
      return;
    }

    if (rolesSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un rol habilitado del trabajador.");
      return;
    }

    try {
      setGuardando(true);
      await crearAsignacion({
        transmisionId: Number(transmisionId),
        trabajadorId: Number(trabajadorId),
        roles: rolesSeleccionados,
        porcentajeComision:
          porcentajeInicial !== "" ? Number(porcentajeInicial) : null,
        tiempoTrasladoConfigMin: Number(tiempoTrasladoMin),
        aceptarAdvertencia,
      });

      setMensaje("Trabajador asignado correctamente a la transmisión.");
      setTrabajadorId("");
      setRolesSeleccionados([]);
      setPorcentajeInicial("");
      setAdvertenciasPendientes([]);
      await cargarDetalleTransmision(transmisionId, tiempoTrasladoMin);
    } catch (err) {
      // Si el trabajador tiene advertencias de horario/disponibilidad/traslado, pedir confirmación al Dueño
      if (trabajadorSeleccionado?.advertencias?.length > 0 && !aceptarAdvertencia) {
        setAdvertenciasPendientes(trabajadorSeleccionado.advertencias);
      } else {
        setError(err.message || "No se pudo realizar la asignación");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function guardarComisionFila(asignacionId) {
    setError("");
    setMensaje("");
    const valor = porcentajesEditados[asignacionId];
    if (valor === "" || Number(valor) <= 0 || Number(valor) > 100) {
      setError("Ingresa un porcentaje de comisión válido entre 0.01% y 100%.");
      return;
    }

    try {
      await definirComision(asignacionId, Number(valor));
      setMensaje("Porcentaje de comisión actualizado.");
      await cargarDetalleTransmision(transmisionId, tiempoTrasladoMin);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la comisión");
    }
  }

  const resumen = contexto?.resumenComisiones;

  return (
    <div style={{ maxWidth: "1020px", margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: "0.5rem" }}>
        Asignación de Personal y Definición de Comisiones
      </h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Asignación de trabajadores activos a transmisiones confirmadas (RF-12) y cálculo de comisiones sobre el precio cotizado (RF-13).
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

      {/* Selector de transmisión y valor configurable de tiempo de traslado */}
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

        <div>
          <label style={{ display: "block", fontWeight: "600", color: "#1e3a8a", marginBottom: "0.35rem" }}>
            Tiempo traslado entre recintos (min):
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              min="0"
              value={tiempoTrasladoMin}
              onChange={(e) => setTiempoTrasladoMin(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #93c5fd" }}
            />
            <button
              type="button"
              onClick={() => cargarDetalleTransmision(transmisionId, tiempoTrasladoMin)}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <p>Cargando transmisiones...</p>
      ) : !contexto ? (
        <p>Selecciona una transmisión para gestionar su personal y comisiones.</p>
      ) : (
        <>
          {/* Resumen financiero de comisiones (RF-13) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Precio Cotizado Transmisión</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#1e3a8a" }}>
                {formatearPesos(resumen?.precioCotizado)}
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Suma de Porcentajes</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#1d4ed8" }}>
                {resumen?.sumaPorcentajes || 0}%
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Comisiones</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#1e40af" }}>
                {formatearPesos(resumen?.totalComisiones)}
              </div>
            </div>

            <div style={{ backgroundColor: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#1e3a8a" }}>Restante antes de otros gastos</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#1e3a8a" }}>
                {formatearPesos(resumen?.montoRestante)}
              </div>
            </div>
          </div>

          {/* Formulario RF-12: Asignar trabajador activo */}
          {puedeEditar && (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem", marginTop: 0 }}>
                Asignar trabajador a "{contexto.transmision.nombreEvento}"
              </h2>

              {contexto.transmision.estado !== "CONFIRMADA" && (
                <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "0.6rem 0.9rem", borderRadius: "6px", marginBottom: "1rem" }}>
                  Nota: Esta transmisión está en estado <strong>{contexto.transmision.estado}</strong>. El requisito exige estado <strong>CONFIRMADA</strong> para registrar nuevas asignaciones.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                    Trabajador Activo (★ Disponibles destacados primero) *
                  </label>
                  <select
                    value={trabajadorId}
                    onChange={(e) => {
                      setTrabajadorId(e.target.value);
                      setRolesSeleccionados([]);
                      setAdvertenciasPendientes([]);
                    }}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
                  >
                    <option value="">Selecciona un trabajador activo...</option>
                    {contexto.candidatos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.disponible ? "★ [DISPONIBLE] " : "⚠ [CON ADVERTENCIA] "}
                        {c.nombre} — Roles: {c.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
                    % Comisión inicial (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={porcentajeInicial}
                    onChange={(e) => setPorcentajeInicial(e.target.value)}
                    placeholder="Ej: 10"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #94a3b8" }}
                  />
                </div>
              </div>

              {trabajadorSeleccionado && (
                <>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.4rem" }}>
                      Roles que desempeñará en la transmisión (solo roles registrados en su ficha) *
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      {trabajadorSeleccionado.roles.map((rol) => (
                        <label
                          key={rol}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            backgroundColor: rolesSeleccionados.includes(rol) ? "#dbeafe" : "#ffffff",
                            border: "1px solid #93c5fd",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={rolesSeleccionados.includes(rol)}
                            onChange={() => alternarRol(rol)}
                          />
                          {ETIQUETAS_ROL[rol] || rol}
                        </label>
                      ))}
                    </div>
                  </div>

                  {trabajadorSeleccionado.advertencias.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fcd34d",
                        color: "#92400e",
                        padding: "0.85rem 1rem",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                      }}
                    >
                      <strong>Advertencia de disponibilidad / horario / traslado:</strong>
                      <ul style={{ margin: "0.4rem 0 0.6rem 1.2rem" }}>
                        {trabajadorSeleccionado.advertencias.map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                      <div style={{ fontSize: "0.9rem" }}>
                        Como Dueño, puedes aceptar esta advertencia y continuar con la asignación.
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {trabajadorSeleccionado?.advertencias?.length > 0 ||
                advertenciasPendientes.length > 0 ? (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => enviarAsignacion(true)}
                    style={{
                      backgroundColor: "#d97706",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {guardando ? "Asignando..." : "Aceptar advertencia y asignar trabajador"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => enviarAsignacion(false)}
                    style={{
                      backgroundColor: "#1d4ed8",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {guardando ? "Asignando..." : "Asignar trabajador"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabla de personal asignado y definición de porcentajes (RF-13) */}
          <h2 style={{ color: "#1e3a8a", fontSize: "1.15rem" }}>
            Personal asignado y comisiones ({contexto.asignaciones.length})
          </h2>

          {contexto.asignaciones.length === 0 ? (
            <p>Aún no hay trabajadores asignados a esta transmisión.</p>
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
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Roles en el evento</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>% Comisión único</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Monto Comisión</th>
                  {puedeEditar && (
                    <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {contexto.asignaciones.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                      {a.trabajador?.nombre}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {a.roles.map((r) => (
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
                      {puedeEditar ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="100"
                            value={porcentajesEditados[a.id] ?? ""}
                            onChange={(e) =>
                              setPorcentajesEditados({
                                ...porcentajesEditados,
                                [a.id]: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            style={{
                              width: "90px",
                              padding: "0.35rem",
                              borderRadius: "4px",
                              border: "1px solid #94a3b8",
                            }}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span>{a.porcentajeComision ? `${a.porcentajeComision}%` : "Sin definir"}</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: "600", color: "#1e3a8a" }}>
                      {formatearPesos(a.montoComision)}
                    </td>
                    {puedeEditar && (
                      <td style={{ padding: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => guardarComisionFila(a.id)}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Guardar %
                        </button>
                      </td>
                    )}
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

export default AsignacionesPage;