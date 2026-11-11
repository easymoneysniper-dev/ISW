// UI · Insignia. tono: "neutro" | "exito" | "advertencia" | "error" | "info".
export default function Badge({ tono = "neutro", children }) {
  return <span className={`ui-badge${tono === "neutro" ? "" : ` ui-badge-${tono}`}`}>{children}</span>;
}
