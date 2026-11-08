// Lista desplegable para elegir una transmisión. La usan las pantallas de pagos y gastos.
// Carga las transmisiones al abrirse y avisa al padre con onCambiar(transmision o null).
import { useEffect, useState } from "react";
import { listarTransmisiones } from "../../services/transmisionService";

function SelectorTransmision({ transmision, onCambiar, onError }) {
  const [transmisiones, setTransmisiones] = useState([]);

  useEffect(() => {
    listarTransmisiones().then(setTransmisiones).catch(onError);
  }, [onError]);

  function elegir(evento) {
    const elegida = transmisiones.find((t) => String(t.id) === evento.target.value);
    onCambiar(elegida ?? null);
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor="transmision">Transmisión </label>
      <select id="transmision" value={transmision?.id ?? ""} onChange={elegir}>
        <option value="">Elige una transmisión</option>
        {transmisiones.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombreEvento} · {t.cliente?.nombre || "Sin cliente"} · {t.estado}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectorTransmision;
