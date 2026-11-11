// UI · Encabezado de pantalla: volver, antetítulo, título y descripción.
export default function CabeceraPagina({ volver, eyebrow, titulo, descripcion, extra }) {
  return (
    <>
      {volver && <a className="ui-volver" href={volver.href}>← {volver.texto}</a>}
      <div className="ui-cabecera">
        <div>
          {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
          <h1>{titulo}</h1>
          {descripcion && <p>{descripcion}</p>}
        </div>
        {extra}
      </div>
    </>
  );
}
