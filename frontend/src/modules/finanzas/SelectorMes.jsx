// Listas para elegir mes y año. La usan los costos fijos y el resumen mensual.
// Avisa al padre con onCambiar({ anio, mes }).
import Campo from "../../components/ui/Campo";
import { NOMBRE_MES } from "./formato";

export default function SelectorMes({ anio, mes, onCambiar }) {
  const anioActual = new Date().getFullYear();
  const anios = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];

  return (
    <div className="ui-filtros">
      <Campo etiqueta="Mes">
        <select value={mes} onChange={(e) => onCambiar({ anio, mes: Number(e.target.value) })}>
          {NOMBRE_MES.map((nombre, indice) => (
            <option key={nombre} value={indice + 1}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Año">
        <select value={anio} onChange={(e) => onCambiar({ anio: Number(e.target.value), mes })}>
          {anios.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </Campo>
    </div>
  );
}