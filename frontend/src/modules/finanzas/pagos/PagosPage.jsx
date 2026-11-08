// Pantalla de pagos del cliente (M4, requisito 4.1).
// El Contador elige una transmisión, ve su estado de pago y registra pagos con comprobante.
// El Dueño ve lo mismo, pero sin el formulario.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { obtenerResumenPagos } from "../../../services/pagoService";
import SelectorTransmision from "../SelectorTransmision";
import ResumenPagos from "./ResumenPagos";
import RegistrarPagoForm from "./RegistrarPagoForm";

// Solo el Contador registra pagos (el backend también lo exige con requireRol).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

// Estados en que el backend no acepta pagos.
const ESTADOS_SIN_PAGO = ["COTIZADA", "RECHAZADA", "CANCELADA"];

function PagosPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);

  const [transmision, setTransmision] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

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

  async function cargarResumen(id) {
    setCargando(true);
    setError("");

    try {
      setResumen(await obtenerResumenPagos(id));
    } catch (err) {
      setResumen(null);
      manejarError(err);
    } finally {
      setCargando(false);
    }
  }

  function elegirTransmision(elegida) {
    setTransmision(elegida);
    setMensaje("");
    setResumen(null);
    if (elegida) cargarResumen(elegida.id);
  }

  async function pagoRegistrado() {
    setMensaje("Pago registrado correctamente");
    await cargarResumen(transmision.id);
  }

  const aceptaPagos = transmision && !ESTADOS_SIN_PAGO.includes(transmision.estado);

  return (
    <section>
      <h2>Pagos del cliente</h2>

      <SelectorTransmision
        transmision={transmision}
        onCambiar={elegirTransmision}
        onError={manejarError}
      />

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#166534" }}>{mensaje}</p>}
      {cargando && <p>Cargando pagos...</p>}

      {resumen && !cargando && (
        <>
          <ResumenPagos resumen={resumen} />

          {puedeRegistrar && aceptaPagos && resumen.saldoPendiente > 0 && (
            <RegistrarPagoForm
              key={transmision.id}
              transmisionId={transmision.id}
              tipoSugerido={resumen.totalPagado < resumen.adelantoMinimo ? "ADELANTO" : "SALDO"}
              onPagoRegistrado={pagoRegistrado}
            />
          )}

          {puedeRegistrar && !aceptaPagos && (
            <p>
              Esta transmisión está {transmision.estado.toLowerCase()}: no se le pueden registrar
              pagos.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default PagosPage;
