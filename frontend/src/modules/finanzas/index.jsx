import ModuloBase from "../ModuloBase";
import PagosPage from "./pagos/PagosPage";
import GastosPage from "./gastos/GastosPage";

// Sustituir las pantallas de este módulo aquí, manteniendo la navegación común.
export default function Modulo(props) {
  if (props.accion?.id === "pagos") return <PagosPage />;
  if (props.accion?.id === "gastos") return <GastosPage />;
  return <ModuloBase {...props} />;
}
