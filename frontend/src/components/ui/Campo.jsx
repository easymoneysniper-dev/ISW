// UI · Campo de formulario: etiqueta, control (children) y ayuda o error.
export default function Campo({ etiqueta, ayuda, error, anchoCompleto = false, children }) {
  return (
    <label className={`ui-campo${anchoCompleto ? " ui-ancho-completo" : ""}`} data-error={error ? "true" : undefined}>
      {etiqueta}
      {children}
      {error ? <span className="ui-campo-error" role="alert">{error}</span> : ayuda && <span className="ui-campo-ayuda">{ayuda}</span>}
    </label>
  );
}
