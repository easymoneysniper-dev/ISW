// UI · Tarjeta con título y acciones opcionales.
import { Card as CardAntd, Space } from "antd";

export default function Card({ titulo, acciones, children, ...props }) {
  return (
    <CardAntd title={titulo} extra={acciones && <Space wrap>{acciones}</Space>} {...props}>
      {children}
    </CardAntd>
  );
}
