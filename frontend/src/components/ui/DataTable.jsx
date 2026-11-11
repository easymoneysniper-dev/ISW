// UI · Tabla. columnas: [{ titulo, campo?, render?, numero? }].
export default function DataTable({ columnas, datos, vacio = "No hay datos para mostrar.", titulo, claveFila = (fila) => fila.id }) {
  if (!datos.length) return <p className="ui-vacio">{vacio}</p>;
  return (
    <div className="ui-tabla-scroll" tabIndex={0} role="region" aria-label={titulo}>
      <table className="ui-tabla">
        {titulo && <caption className="ui-solo-lectores">{titulo}</caption>}
        <thead>
          <tr>{columnas.map((col) => <th key={col.titulo} className={col.numero ? "ui-numero" : undefined}>{col.titulo}</th>)}</tr>
        </thead>
        <tbody>
          {datos.map((fila) => (
            <tr key={claveFila(fila)}>
              {columnas.map((col) => (
                <td key={col.titulo} className={col.numero ? "ui-numero" : undefined}>
                  {col.render ? col.render(fila) : fila[col.campo]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
