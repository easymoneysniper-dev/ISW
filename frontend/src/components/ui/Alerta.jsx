// UI · Mensaje destacado. tipo: "error" | "exito" | "advertencia" | "info".
export default function Alerta({ tipo = "info", children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className={`ui-alerta ui-alerta-${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
