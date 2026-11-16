// UI · Insignia. tono: "neutro" | "exito" | "advertencia" | "error" | "info".
import { Tag } from "antd";

const COLOR = { neutro: "default", exito: "success", advertencia: "warning", error: "error", info: "processing" };

export default function Badge({ tono = "neutro", children }) {
  return <Tag color={COLOR[tono]}>{children}</Tag>;
}
