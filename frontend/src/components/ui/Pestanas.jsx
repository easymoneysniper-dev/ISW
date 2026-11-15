// UI · Pestañas. pestanas: [{ clave, titulo, contenido }].
import { Tabs } from "antd";

export default function Pestanas({ pestanas, activa, onCambiar }) {
  return (
    <Tabs
      activeKey={activa}
      onChange={onCambiar}
      items={pestanas.map((p) => ({ key: p.clave, label: p.titulo, children: p.contenido }))}
    />
  );
}
