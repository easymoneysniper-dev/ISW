// Pantalla de gastos y costos fijos.
// El Contador elige una transmisión, registra sus gastos con comprobante y completa la rendición.
// Debajo anota los costos fijos del mes.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import { obtenerGastos, completarRendicion } from "../../../services/gastoService";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import Boton from "../../../components/ui/Boton";
import Modal from "../../../components/ui/Modal";
import SelectorTransmision from "../SelectorTransmision";
import CostosFijosPage from "../costos/CostosFijosPage";
import ListaGastos from "./ListaGastos";
import RegistrarGastoForm from "./RegistrarGastoForm";

// Solo el Contador registra gastos y completa la rendición (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

// Estados en que el backend no acepta gastos.
const ESTADOS_SIN_GASTOS = ["COTIZADA", "RECHAZADA"];

export default function GastosPage() {
  const { usuario } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);
  const [transmision, setTransmision] = useState(null);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/finanzas", texto: "Finanzas y auspiciadores" }}
        titulo="Gastos y costos fijos"
        descripcion="Registra los gastos de cada transmisión con su comprobante, completa la rendición y anota los costos fijos del mes."
        extra={<Badge tono="info">{puedeRegistrar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Card titulo="Transmisión">
        <SelectorTransmision transmision={transmision} onCambiar={setTransmision} />
      </Card>

      {transmision && (
        <GastosDeTransmision key={transmision.id} transmision={transmision} puedeRegistrar={puedeRegistrar} />
      )}

      <CostosFijosPage />
    </section>
  );
}

// Gastos de la transmisión elegida. Se vuelve a crear cada vez que se elige otra.
function GastosDeTransmision({ transmision, puedeRegistrar }) {
  const cargar = useCallback(() => obtenerGastos(transmision.id), [transmision.id]);
  const { datos: resultado, cargando, error, recargar } = useFetch(cargar);
  const rendicion = useAccion();
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function gastoRegistrado() {
    setMensaje("Gasto registrado correctamente.");
    recargar();
  }

  async function completar() {
    const respuesta = await rendicion.ejecutar(() => completarRendicion(transmision.id));
    setConfirmando(false);
    if (!respuesta) return;

    setMensaje("Rendición completada.");
    recargar();
  }

  const pendiente = resultado && !resultado.rendicionCompleta;
  const realizada = resultado?.estadoTransmision === "REALIZADA";
  const aceptaGastos = pendiente && !ESTADOS_SIN_GASTOS.includes(transmision.estado);

  return (
    <>
      <Card
        titulo="Gastos"
        acciones={
          puedeRegistrar &&
          pendiente && (
            <Boton onClick={() => setConfirmando(true)} disabled={!realizada}>
              Completar rendición
            </Boton>
          )
        }
      >
        <Alerta tipo="error">{error || rendicion.error}</Alerta>
        <Alerta tipo="exito">{mensaje}</Alerta>
        {puedeRegistrar && pendiente && !realizada && (
          <Alerta tipo="info">La rendición se puede completar cuando la transmisión está Realizada.</Alerta>
        )}
        {cargando && !resultado && <p role="status">Cargando gastos…</p>}
        {resultado && <ListaGastos resultado={resultado} />}
      </Card>

      {puedeRegistrar && aceptaGastos && <RegistrarGastoForm transmisionId={transmision.id} onGastoRegistrado={gastoRegistrado} />}

      <Modal
        abierto={confirmando}
        titulo="Completar rendición"
        onCerrar={() => setConfirmando(false)}
        acciones={
          <>
            <Boton variante="secundario" onClick={() => setConfirmando(false)} disabled={rendicion.guardando}>
              Cancelar
            </Boton>
            <Boton onClick={completar} cargando={rendicion.guardando}>
              Completar rendición
            </Boton>
          </>
        }
      >
        <p>¿Recibiste todos los gastos? Después de completar la rendición no se aceptan gastos nuevos.</p>
      </Modal>
    </>
  );
}