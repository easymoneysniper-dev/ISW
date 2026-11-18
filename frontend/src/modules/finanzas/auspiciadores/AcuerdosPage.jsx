// Pantalla de acuerdos con auspiciadores (Dueño).
// El Dueño registra auspiciadores y acuerdos, ve el historial y marca aportes como No cumplido.
import { useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { listarAuspiciadores, listarAportes } from "../../../services/auspiciadorService";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import Boton from "../../../components/ui/Boton";
import ListaAportes from "./ListaAportes";
import RegistrarAuspiciadorForm from "./RegistrarAuspiciadorForm";
import RegistrarAcuerdoForm from "./RegistrarAcuerdoForm";
import NoCumplidoForm from "./NoCumplidoForm";

// Solo el Dueño registra acuerdos y marca No cumplido (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["DUENO"];

const cargar = () => Promise.all([listarAuspiciadores(), listarAportes()]);

export default function AcuerdosPage() {
  const { usuario } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [auspiciadores, aportes] = datos ?? [[], null];
  const [elegido, setElegido] = useState(null);
  const [mensaje, setMensaje] = useState("");

  function listo(texto) {
    setMensaje(texto);
    setElegido(null);
    recargar();
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/finanzas", texto: "Finanzas y auspiciadores" }}
        titulo="Acuerdos con auspiciadores"
        descripcion="Registra auspiciadores y sus acuerdos, revisa el historial y marca los aportes que no se cumplieron."
        extra={<Badge tono="info">{puedeRegistrar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Alerta tipo="exito">{mensaje}</Alerta>

      {puedeRegistrar && (
        <>
          <RegistrarAuspiciadorForm
            onRegistrado={(auspiciador) => listo(`Auspiciador "${auspiciador.nombre}" registrado.`)}
          />
          <RegistrarAcuerdoForm
            auspiciadores={auspiciadores}
            onRegistrado={() => listo("Acuerdo registrado: queda Comprometido.")}
          />
        </>
      )}

      <Card titulo="Historial de aportes">
        <Alerta tipo="error">{error}</Alerta>
        {cargando && !aportes && <p role="status">Cargando acuerdos…</p>}
        {aportes && (
          <ListaAportes
            aportes={aportes}
            renderAccion={(aporte) =>
              puedeRegistrar &&
              aporte.estado === "COMPROMETIDO" && (
                <Boton variante="secundario" onClick={() => setElegido(aporte)}>
                  Marcar No cumplido
                </Boton>
              )
            }
          />
        )}
      </Card>

      {elegido && (
        <NoCumplidoForm
          aporte={elegido}
          onMarcado={() => listo("Aporte marcado como No cumplido.")}
          onCancelar={() => setElegido(null)}
        />
      )}
    </section>
  );
}