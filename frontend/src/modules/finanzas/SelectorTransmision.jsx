// Lista desplegable para elegir una transmisión. La usan pagos, gastos y la rentabilidad.
// Carga las transmisiones al abrirse y avisa al padre con onCambiar(transmision o null).
import { listarTransmisiones } from "../../services/transmisionService";
import { useFetch } from "../../hooks/useFetch";
import { NOMBRE_ESTADO } from "../../utils/transmision";
import Campo from "../../components/ui/Campo";

export default function SelectorTransmision({ transmision, onCambiar }) {
  const { datos, cargando, error } = useFetch(listarTransmisiones);
  const transmisiones = datos ?? [];

  function elegir(evento) {
    const elegida = transmisiones.find((t) => String(t.id) === evento.target.value);
    onCambiar(elegida ?? null);
  }

  return (
    <div className="ui-filtros">
      <Campo etiqueta="Transmisión" error={error}>
        <select value={transmision?.id ?? ""} onChange={elegir} disabled={cargando}>
          <option value="">{cargando ? "Cargando transmisiones…" : "Elige una transmisión"}</option>
          {transmisiones.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombreEvento} · {t.cliente?.nombre || "Sin cliente"} · {NOMBRE_ESTADO[t.estado] ?? t.estado}
            </option>
          ))}
        </select>
      </Campo>
    </div>
  );
}