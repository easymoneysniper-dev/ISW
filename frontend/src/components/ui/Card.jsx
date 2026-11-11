// UI · Tarjeta con título y acciones opcionales.
export default function Card({ titulo, acciones, children, ...props }) {
  return (
    <section className="ui-card" {...props}>
      {(titulo || acciones) && (
        <div className="ui-card-cabecera">
          {titulo && <h2>{titulo}</h2>}
          {acciones && <div className="ui-card-acciones">{acciones}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
