// UI · Lista de datos etiqueta → valor (ficha). datos: [{ etiqueta, valor }].
import { Descriptions } from "antd";

export default function ListaDatos({ datos, columnas = 2 }) {
  return (
    <Descriptions
      bordered
      size="small"
      column={{ xs: 1, md: columnas }}
      items={datos.map((d) => ({ key: d.etiqueta, label: d.etiqueta, children: d.valor }))}
    />
  );
}
