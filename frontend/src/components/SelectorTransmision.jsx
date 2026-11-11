// Común · Lista para elegir una transmisión. filtro: (t) => boolean para mostrar solo algunas.
import { listarTransmisiones } from "../services/transmisionService";
import { useFetch } from "../hooks/useFetch";
import { fechaHora } from "../utils/formato";
import { NOMBRE_ESTADO } from "../utils/transmision";
import Campo from "./ui/Campo";

export default function SelectorTransmision({ valor, onCambiar, filtro = () => true, etiqueta = "Transmisión", ayuda }) {
  const { datos, cargando, error } = useFetch(listarTransmisiones);
  const opciones = (datos ?? []).filter(filtro);

  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda ?? (!cargando && !opciones.length ? "No hay transmisiones en los estados que permite esta acción." : undefined)}>
      <select value={valor ?? ""} onChange={(e) => onCambiar(e.target.value ? Number(e.target.value) : null)} disabled={cargando}>
        <option value="">{cargando ? "Cargando transmisiones…" : "Elige una transmisión"}</option>
        {opciones.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombreEvento} · {fechaHora(t.inicio)} · {NOMBRE_ESTADO[t.estado] ?? t.estado}
          </option>
        ))}
      </select>
    </Campo>
  );
}
