// UI · Campo de formulario: etiqueta, control (children) y ayuda o error.
import { Typography } from "antd";

export default function Campo({ etiqueta, ayuda, error, anchoCompleto = false, children }) {
  return (
    <label className={`ui-campo${anchoCompleto ? " ui-ancho-completo" : ""}`} data-error={error ? "true" : undefined}>
      <span>{etiqueta}</span>
      {children}
      {error
        ? <Typography.Text type="danger" role="alert">{error}</Typography.Text>
        : ayuda && <Typography.Text type="secondary">{ayuda}</Typography.Text>}
    </label>
  );
}
