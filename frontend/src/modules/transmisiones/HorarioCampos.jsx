// M1 · Campos de fecha, hora de inicio y hora de término. Los usan el registro (RF 1.1) y la reprogramación (RF 1.6).
// resultado = horarioAIso(valor): muestra el error o avisa si el evento termina al día siguiente.
import Campo from "../../components/ui/Campo";
import { hoyLocal } from "../../utils/transmision";

export default function HorarioCampos({ valor, onCambiar, resultado, mostrarError }) {
  const cambio = (campo) => (e) => onCambiar({ ...valor, [campo]: e.target.value });
  const error = mostrarError ? resultado.error : undefined;

  return (
    <>
      <Campo etiqueta="Fecha *" error={error}>
        <input type="date" required min={hoyLocal()} value={valor.fecha} onChange={cambio("fecha")} />
      </Campo>
      <Campo etiqueta="Hora de inicio *">
        <input type="time" required value={valor.horaInicio} onChange={cambio("horaInicio")} />
      </Campo>
      <Campo etiqueta="Hora de término *" ayuda={resultado.diaSiguiente ? "Termina al día siguiente." : undefined}>
        <input type="time" required value={valor.horaTermino} onChange={cambio("horaTermino")} />
      </Campo>
    </>
  );
}
