// M3 · Inventario y kits: elige la pantalla según la sección del menú.
import ModuloBase from "../ModuloBase";
import EquiposPage from "../../pages/inventario/EquiposPage";
import KitsPage from "./kits/KitsPage";
import AsignarKitsPage from "./asignar/AsignarKitsPage";
import MovimientosPage from "./movimientos/MovimientosPage";
import ReportePage from "./reporte/ReportePage";

const pantallas = {
  equipos: EquiposPage,
  kits: KitsPage,
  asignar: AsignarKitsPage,
  movimientos: MovimientosPage,
  incidentes: ReportePage,
};

export default function Modulo(props) {
  const Pantalla = pantallas[props.accion?.id];
  return Pantalla ? <Pantalla /> : <ModuloBase {...props} />;
}
