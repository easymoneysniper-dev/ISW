import ModuloBase from "../ModuloBase";
import TrabajadoresPage from "../../pages/personal/TrabajadoresPage";

// Sustituir las pantallas de este módulo aquí, manteniendo la navegación común.
export default function Modulo(props) {
  if (props.accion?.id === "trabajadores") return <TrabajadoresPage />;
  return <ModuloBase {...props} />;
}