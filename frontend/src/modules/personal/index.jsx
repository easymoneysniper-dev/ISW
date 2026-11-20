// M2 · Personal y asignaciones: elige la pantalla según la sección del menú.
import ModuloBase from "../ModuloBase";
import TrabajadoresYDisponibilidadPage from "./trabajadores/TrabajadoresYDisponibilidadPage";
import AsignacionesPage from "./asignaciones/AsignacionesPage";
import ReemplazosAsistenciaPage from "./asistencia/ReemplazosAsistenciaPage";

const pantallas = {
  trabajadores: TrabajadoresYDisponibilidadPage,
  asignaciones: AsignacionesPage,
  asistencia: ReemplazosAsistenciaPage,
};

export default function Modulo(props) {
  const Pantalla = pantallas[props.accion?.id];
  return Pantalla ? <Pantalla key={props.accion.id} /> : <ModuloBase {...props} />;
}