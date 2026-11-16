// Pantalla de aportes recibidos. Acción "aportes" del menú (Contador).
// El Contador consulta los acuerdos y registra la recepción de los aportes Comprometidos o Atrasados
// con su comprobante; si es canje, ingresa su valor en pesos.
import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { listarAportes } from "../../../services/auspiciadorService";
import ListaAportes from "./ListaAportes";
import RecepcionAporteForm from "./RecepcionAporteForm";

// Solo el Contador registra la recepción (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

function AportesPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);

  const [aportes, setAportes] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

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

  const cargar = useCallback(() => {
    listarAportes().then(setAportes).catch(manejarError);
  }, [manejarError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function recepcionRegistrada() {
    setMensaje("Recepción registrada: el aporte queda Cumplido");
    setError("");
    setElegido(null);
    cargar();
  }

  return (
    <section>
      <h2>Aportes de auspiciadores</h2>
      <p>Registra la recepción de los aportes Comprometidos o Atrasados con su comprobante.</p>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}
      {!aportes && !error && <p>Cargando aportes...</p>}

      {aportes && (
        <ListaAportes
          aportes={aportes}
          renderAccion={(aporte) =>
            puedeRegistrar &&
            aporte.estado === "COMPROMETIDO" && (
              <button
                type="button"
                onClick={() => {
                  setMensaje("");
                  setElegido(aporte);
                }}
              >
                Registrar recepción
              </button>
            )
          }
        />
      )}

      {elegido && (
        <RecepcionAporteForm
          key={elegido.id}
          aporte={elegido}
          onRegistrada={recepcionRegistrada}
          onCancelar={() => setElegido(null)}
        />
      )}
    </section>
  );
}

export default AportesPage;