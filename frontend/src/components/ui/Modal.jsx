// UI · Ventana modal. acciones: botones del pie; si no hay, la ventana no muestra pie. ancho en píxeles.
import { Modal as ModalAntd } from "antd";

export default function Modal({ abierto, titulo, onCerrar, acciones, ancho, children }) {
  return (
    <ModalAntd open={abierto} title={titulo} onCancel={onCerrar} footer={acciones ?? null} width={ancho} destroyOnHidden>
      {children}
    </ModalAntd>
  );
}
