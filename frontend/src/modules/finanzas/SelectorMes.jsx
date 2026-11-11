// Listas para elegir mes y año. La usan las pantallas de costos fijos y del resumen mensual.
// Avisa al padre con onCambiar({ anio, mes }).
import { NOMBRE_MES } from "./formato";

function SelectorMes({ anio, mes, onCambiar }) {
  const anioActual = new Date().getFullYear();
  const anios = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
      <label htmlFor="mes">Mes</label>
      <select id="mes" value={mes} onChange={(e) => onCambiar({ anio, mes: Number(e.target.value) })}>
        {NOMBRE_MES.map((nombre, indice) => (
          <option key={nombre} value={indice + 1}>
            {nombre}
          </option>
        ))}
      </select>

      <label htmlFor="anio">Año</label>
      <select id="anio" value={anio} onChange={(e) => onCambiar({ anio: Number(e.target.value), mes })}>
        {anios.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectorMes;
