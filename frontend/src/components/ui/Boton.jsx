// UI · Botón. variante: "primario" | "secundario" | "peligro" | "texto". El resto de props va al botón de antd.
import { Button } from "antd";

const ESTILO = {
  primario: { type: "primary" },
  secundario: {},
  peligro: { danger: true },
  texto: { type: "link" },
};

export default function Boton({ children, variante = "primario", cargando = false, type = "button", ...props }) {
  return (
    <Button {...ESTILO[variante]} htmlType={type} loading={cargando} {...props}>
      {children}
    </Button>
  );
}
