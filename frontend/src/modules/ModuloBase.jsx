import { accionesPermitidas } from "../config/modulos";

export default function ModuloBase({ modulo, accion, rol }) {
  if (accion) {
    return <section className="panel-modulo">
      <a href={`#/${modulo.id}`}>← Volver a {modulo.titulo}</a>
      <h1>{accion.titulo}</h1>
      <span className="etiqueta">{accion.consulta.includes(rol) ? "Solo consulta" : "Gestión"}</span>
      <h2>Funcionalidad en preparación</h2>
      <p>Esta sección todavía no permite consultar ni registrar datos. Estará disponible en una próxima entrega.</p>
    </section>;
  }
  return <section>
    <a href="#/">← Menú principal</a>
    <h1>{modulo.titulo}</h1>
    <p>{modulo.descripcion}</p>
    <div className="menu-grid">
      {accionesPermitidas(modulo, rol).map((item) => <a className="menu-card" key={item.id} href={`#/${modulo.id}/${item.id}`}>
        <span className="etiqueta">{item.consulta.includes(rol) ? "Solo consulta" : "Gestión"}</span>
        <h2>{item.titulo}</h2><p>{item.disponible ? item.descripcion : "En preparación"}</p><span className="menu-link">Abrir sección →</span>
      </a>)}
    </div>
  </section>;
}
