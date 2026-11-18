// Pantalla de aportes recibidos (Contador).
// El Contador consulta los acuerdos y registra la recepción de los aportes Comprometidos o Atrasados
// con su comprobante; si es canje, ingresa su valor en pesos.
import { useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { listarAportes } from "../../../services/auspiciadorService";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import Boton from "../../../components/ui/Boton";
import ListaAportes from "./ListaAportes";
import RecepcionAporteForm from "./RecepcionAporteForm";

// Solo el Contador registra la recepción (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

export default function AportesPage() {
  const { usuario } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);
  const { datos: aportes, cargando, error, recargar } = useFetch(listarAportes);
  const [elegido, setElegido] = useState(null);
  const [mensaje, setMensaje] = useState("");

  function recepcionRegistrada() {
    setMensaje("Recepción registrada: el aporte queda Cumplido.");
    setElegido(null);
    recargar();
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/finanzas", texto: "Finanzas y auspiciadores" }}
        titulo="Aportes de auspiciadores"
        descripcion="Registra la recepción de los aportes Comprometidos o Atrasados con su comprobante."
        extra={<Badge tono="info">{puedeRegistrar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Alerta tipo="exito">{mensaje}</Alerta>

      <Card titulo="Acuerdos y aportes">
        <Alerta tipo="error">{error}</Alerta>
        {cargando && !aportes && <p role="status">Cargando aportes…</p>}
        {aportes && (
          <ListaAportes
            aportes={aportes}
            renderAccion={(aporte) =>
              puedeRegistrar &&
              aporte.estado === "COMPROMETIDO" && (
                <Boton
                  variante="secundario"
                  onClick={() => {
                    setMensaje("");
                    setElegido(aporte);
                  }}
                >
                  Registrar recepción
                </Boton>
              )
            }
          />
        )}
      </Card>

      {elegido && (
        <RecepcionAporteForm aporte={elegido} onRegistrada={recepcionRegistrada} onCancelar={() => setElegido(null)} />
      )}
    </section>
  );
}