// UI · Botón. variante: "primario" | "secundario" | "peligro" | "texto". El resto de props va al <button>.
export default function Boton({ children, variante = "primario", cargando = false, disabled, type = "button", ...props }) {
  return (
    <button type={type} className={`ui-boton ui-boton-${variante}`} disabled={disabled || cargando} aria-busy={cargando || undefined} {...props}>
      {cargando && <span className="ui-girando" aria-hidden="true" />}
      {children}
    </button>
  );
}
