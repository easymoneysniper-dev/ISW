// Pantalla de gastos y rendición (M4, requisito 4.2).
// El Contador elige una transmisión, registra sus gastos con comprobante y completa la rendición.
// El Dueño ve los gastos, pero sin el formulario ni el botón.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { obtenerGastos, completarRendicion } from "../../../services/gastoService";
import SelectorTransmision from "../SelectorTransmision";
import ListaGastos from "./ListaGastos";
import RegistrarGastoForm from "./RegistrarGastoForm";

// Solo el Contador registra gastos y completa la rendición (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

// Estados en que el backend no acepta gastos.
const ESTADOS_SIN_GASTOS = ["COTIZADA", "RECHAZADA"];

function GastosPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);

  const [transmision, setTransmision] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [completando, setCompletando] = useState(false);

  // Si la sesión venció vuelve al login; si no, muestra el mensaje del backend.
  const manejarError = useCallback(
    (err) => {
      if (err.status === 401) {
        sesionExpirada();
        return;
      }
      setError(err.message);
    },
    [sesionExpirada]
  );

  async function cargarGastos(id) {
    setCargando(true);
    setError("");

    try {
      setResultado(await obtenerGastos(id));
    } catch (err) {
      setResultado(null);
      manejarError(err);
    } finally {
      setCargando(false);
    }
  }

  function elegirTransmision(elegida) {
    setTransmision(elegida);
    setMensaje("");
    setResultado(null);
    if (elegida) cargarGastos(elegida.id);
  }

  async function gastoRegistrado() {
    setMensaje("Gasto registrado correctamente");
    await cargarGastos(transmision.id);
  }

  async function manejarCompletarRendicion() {
    const confirmado = window.confirm(
      "¿Recibiste todos los gastos? Después de completar la rendición no se aceptan gastos nuevos."
    );
    if (!confirmado) return;

    setCompletando(true);
    setError("");
    setMensaje("");

    try {
      await completarRendicion(transmision.id);
      setMensaje("Rendición completada");
      await cargarGastos(transmision.id);
    } catch (err) {
      manejarError(err);
    } finally {
      setCompletando(false);
    }
  }

  const aceptaGastos =
    transmision && !ESTADOS_SIN_GASTOS.includes(transmision.estado) && !resultado?.rendicionCompleta;

  return (
    <section>
      <h2>Gastos y rendición</h2>

      <SelectorTransmision
        transmision={transmision}
        onCambiar={elegirTransmision}
        onError={manejarError}
      />

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}
      {cargando && <p>Cargando gastos...</p>}

      {resultado && !cargando && (
        <>
          <ListaGastos resultado={resultado} />

          {puedeRegistrar && !resultado.rendicionCompleta && (
            <p>
              <button
                type="button"
                onClick={manejarCompletarRendicion}
                disabled={completando || resultado.estadoTransmision !== "REALIZADA"}
              >
                {completando ? "Completando..." : "Completar rendición"}
              </button>{" "}
              {resultado.estadoTransmision !== "REALIZADA" && (
                <small>Se habilita cuando la transmisión está Realizada.</small>
              )}
            </p>
          )}

          {puedeRegistrar && aceptaGastos && (
            <RegistrarGastoForm key={transmision.id} transmisionId={transmision.id} onGastoRegistrado={gastoRegistrado} />
          )}
        </>
      )}
    </section>
  );
}

export default GastosPage;
