// Pantalla de acuerdos con auspiciadores. Acción "acuerdos" del menú (Dueño).
// El Dueño registra auspiciadores y acuerdos, ve el historial y marca aportes como No cumplido.
import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { listarAuspiciadores, listarAportes } from "../../../services/auspiciadorService";
import ListaAportes from "./ListaAportes";
import RegistrarAuspiciadorForm from "./RegistrarAuspiciadorForm";
import RegistrarAcuerdoForm from "./RegistrarAcuerdoForm";
import NoCumplidoForm from "./NoCumplidoForm";

// Solo el Dueño registra acuerdos y marca No cumplido (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["DUENO"];

function AcuerdosPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);

  const [auspiciadores, setAuspiciadores] = useState([]);
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
    Promise.all([listarAuspiciadores(), listarAportes()])
      .then(([listaAuspiciadores, listaAportes]) => {
        setAuspiciadores(listaAuspiciadores);
        setAportes(listaAportes);
      })
      .catch(manejarError);
  }, [manejarError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function listo(texto) {
    setMensaje(texto);
    setError("");
    setElegido(null);
    cargar();
  }

  return (
    <section>
      <h2>Acuerdos con auspiciadores</h2>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}

      {puedeRegistrar && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
          <RegistrarAuspiciadorForm
            onRegistrado={(auspiciador) => listo(`Auspiciador "${auspiciador.nombre}" registrado`)}
          />
          <RegistrarAcuerdoForm
            auspiciadores={auspiciadores}
            onRegistrado={() => listo("Acuerdo registrado: queda Comprometido")}
            onError={manejarError}
          />
        </div>
      )}

      <h3>Historial de aportes</h3>
      {!aportes && !error && <p>Cargando acuerdos...</p>}
      {aportes && (
        <ListaAportes
          aportes={aportes}
          renderAccion={(aporte) =>
            puedeRegistrar &&
            aporte.estado === "COMPROMETIDO" && (
              <button type="button" onClick={() => setElegido(aporte)}>
                Marcar No cumplido
              </button>
            )
          }
        />
      )}

      {elegido && (
        <NoCumplidoForm
          key={elegido.id}
          aporte={elegido}
          onMarcado={() => listo("Aporte marcado como No cumplido")}
          onCancelar={() => setElegido(null)}
        />
      )}
    </section>
  );
}

export default AcuerdosPage;