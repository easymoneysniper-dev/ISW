// M1 · Transmisiones y cotización: elige la pantalla según la sección del menú.
import ModuloBase from "../ModuloBase";
import RegistrarPage from "./registro/RegistrarPage";
import TransmisionesPage from "./lista/TransmisionesPage";
import CalendarioPage from "./calendario/CalendarioPage";

const pantallas = {
  registro: RegistrarPage,
  estados: () => <TransmisionesPage modo="estados" />,
  cambios: () => <TransmisionesPage modo="cambios" />,
  calendario: CalendarioPage,
};

export default function Modulo(props) {
  const Pantalla = pantallas[props.accion?.id];
  return Pantalla ? <Pantalla key={props.accion.id} /> : <ModuloBase {...props} />;
}
