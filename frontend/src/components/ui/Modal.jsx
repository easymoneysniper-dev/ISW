// UI · Ventana modal con <dialog> nativo: el navegador maneja el foco y la tecla Escape.
import { useEffect, useRef } from "react";

export default function Modal({ abierto, titulo, onCerrar, acciones, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog ref={ref} className="ui-modal" aria-labelledby="ui-modal-titulo" onClose={onCerrar} onCancel={onCerrar}>
      {abierto && (
        <div className="ui-modal-contenido">
          <h2 id="ui-modal-titulo">{titulo}</h2>
          {children}
          {acciones && <div className="ui-modal-acciones">{acciones}</div>}
        </div>
      )}
    </dialog>
  );
}
