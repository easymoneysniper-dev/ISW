// Finanzas y auspiciadores: elige la pantalla según la sección del menú.
import ModuloBase from "../ModuloBase";
import PagosPage from "./pagos/PagosPage";
import GastosPage from "./gastos/GastosPage";
import ResumenMensualPage from "./resumen/ResumenMensualPage";
import AcuerdosPage from "./auspiciadores/AcuerdosPage";
import AportesPage from "./auspiciadores/AportesPage";

const pantallas = {
  pagos: PagosPage,
  gastos: GastosPage,
  resumen: ResumenMensualPage,
  acuerdos: AcuerdosPage,
  aportes: AportesPage,
};

export default function Modulo(props) {
  const Pantalla = pantallas[props.accion?.id];
  return Pantalla ? <Pantalla key={props.accion.id} /> : <ModuloBase {...props} />;
}