// Pantalla de pagos del cliente.
// El Contador elige una transmisión, ve su estado de pago y registra pagos con comprobante.
// Si la transmisión está Cancelada, también ve y registra la devolución del adelanto.
// El Dueño ve lo mismo, pero sin los formularios.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { obtenerResumenPagos } from "../../../services/pagoService";
import { NOMBRE_ESTADO } from "../../../utils/transmision";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import SelectorTransmision from "../SelectorTransmision";
import ResumenPagos from "./ResumenPagos";
import RegistrarPagoForm from "./RegistrarPagoForm";
import DevolucionAdelanto from "./DevolucionAdelanto";

// Solo el Contador registra pagos (el backend también lo exige con requireRol).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

// Estados en que el backend no acepta pagos.
const ESTADOS_SIN_PAGO = ["COTIZADA", "RECHAZADA", "CANCELADA"];

export default function PagosPage() {
  const { usuario } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);
  const [transmision, setTransmision] = useState(null);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/finanzas", texto: "Finanzas y auspiciadores" }}
        titulo="Pagos del cliente"
        descripcion="Elige una transmisión para ver su estado de pago y los pagos recibidos."
        extra={<Badge tono="info">{puedeRegistrar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Card titulo="Transmisión">
        <SelectorTransmision transmision={transmision} onCambiar={setTransmision} />
      </Card>

      {transmision && (
        <PagosDeTransmision key={transmision.id} transmision={transmision} puedeRegistrar={puedeRegistrar} />
      )}
    </section>
  );
}

// Estado de pago de la transmisión elegida. Se vuelve a crear cada vez que se elige otra.
function PagosDeTransmision({ transmision, puedeRegistrar }) {
  const cargar = useCallback(() => obtenerResumenPagos(transmision.id), [transmision.id]);
  const { datos: resumen, cargando, error, recargar } = useFetch(cargar);
  const [mensaje, setMensaje] = useState("");

  function pagoRegistrado() {
    setMensaje("Pago registrado correctamente.");
    recargar();
  }

  const aceptaPagos = !ESTADOS_SIN_PAGO.includes(transmision.estado);

  return (
    <>
      <Card titulo="Estado de pago">
        <Alerta tipo="error">{error}</Alerta>
        <Alerta tipo="exito">{mensaje}</Alerta>
        {cargando && !resumen && <p role="status">Cargando pagos…</p>}
        {resumen && <ResumenPagos resumen={resumen} />}
        {puedeRegistrar && !aceptaPagos && (
          <Alerta tipo="info">
            Esta transmisión está {NOMBRE_ESTADO[transmision.estado].toLowerCase()}: no se le pueden registrar pagos.
          </Alerta>
        )}
      </Card>

      {puedeRegistrar && aceptaPagos && resumen && resumen.saldoPendiente > 0 && (
        <RegistrarPagoForm
          transmisionId={transmision.id}
          tipoSugerido={resumen.totalPagado < resumen.adelantoMinimo ? "ADELANTO" : "SALDO"}
          onPagoRegistrado={pagoRegistrado}
        />
      )}

      {transmision.estado === "CANCELADA" && (
        <DevolucionAdelanto transmisionId={transmision.id} puedeRegistrar={puedeRegistrar} />
      )}
    </>
  );
}