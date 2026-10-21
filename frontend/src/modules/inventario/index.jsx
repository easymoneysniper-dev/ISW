import ModuloBase from "../ModuloBase";
import EquiposPage from "../../pages/inventario/EquiposPage";

// Sustituir las pantallas de este módulo aquí, manteniendo la navegación común.
export default function Modulo(props) {
  if (props.accion?.id === "equipos") return <EquiposPage />;
  return <ModuloBase {...props} />;
}
