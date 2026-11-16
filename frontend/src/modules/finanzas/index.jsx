import ModuloBase from "../ModuloBase";
import PagosPage from "./pagos/PagosPage";
import GastosPage from "./gastos/GastosPage";
import CostosFijosPage from "./costos/CostosFijosPage";
import ResumenMensualPage from "./resumen/ResumenMensualPage";
import AcuerdosPage from "./auspiciadores/AcuerdosPage";
import AportesPage from "./auspiciadores/AportesPage";

// Sustituir las pantallas de este módulo aquí, manteniendo la navegación común.
export default function Modulo(props) {
  if (props.accion?.id === "pagos") return <PagosPage />;
  if (props.accion?.id === "gastos") {
    return (
      <>
        <GastosPage />
        <CostosFijosPage />
      </>
    );
  }
  if (props.accion?.id === "resumen") return <ResumenMensualPage />;
    if (props.accion?.id === "acuerdos") return <AcuerdosPage />;
      if (props.accion?.id === "aportes") return <AportesPage />;
  return <ModuloBase {...props} />;
}