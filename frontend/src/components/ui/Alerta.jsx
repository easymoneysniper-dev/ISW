// UI · Mensaje destacado. tipo: "error" | "exito" | "advertencia" | "info".
import { Alert } from "antd";

const TIPO = { error: "error", exito: "success", advertencia: "warning", info: "info" };

export default function Alerta({ tipo = "info", children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return <Alert type={TIPO[tipo]} showIcon title={children} role={tipo === "error" ? "alert" : "status"} />;
}
