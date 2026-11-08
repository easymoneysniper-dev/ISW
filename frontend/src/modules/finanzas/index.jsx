import ModuloBase from "../ModuloBase";
import PagosPage from "./pagos/PagosPage";

// Sustituir las pantallas de este módulo aquí, manteniendo la navegación común.
export default function Modulo(props) {
  if (props.accion?.id === "pagos") return <PagosPage />;
  return <ModuloBase {...props} />;
}