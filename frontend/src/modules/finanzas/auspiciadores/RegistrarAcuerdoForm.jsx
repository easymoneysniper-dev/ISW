// Formulario para registrar un acuerdo con un auspiciador.
// Lo usa AcuerdosPage.jsx, que le pasa los auspiciadores. El acuerdo queda Comprometido.
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearAcuerdoSchema } from "../../../schemas/auspiciador.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarAcuerdo } from "../../../services/auspiciadorService";
import { listarTransmisiones } from "../../../services/transmisionService";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import { NOMBRE_ESTADO } from "../../../utils/transmision";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";

function valoresIniciales() {
  return { tipo: "DINERO", fechaComprometida: fechaDeHoy() };
}

export default function RegistrarAcuerdoForm({ auspiciadores, onRegistrado }) {
  const transmisiones = useFetch(listarTransmisiones);
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(crearAcuerdoSchema),
    defaultValues: valoresIniciales(),
    // Si se cambia a canje, el campo del monto se oculta y su valor se descarta.
    shouldUnregister: true,
  });

  const tipo = useWatch({ control, name: "tipo" });

  async function onSubmit(datos) {
    // Si es canje, el valor en pesos se ingresa al recibirlo.
    const acuerdo = await ejecutar(() =>
      registrarAcuerdo({ ...datos, valorPesos: datos.tipo === "DINERO" ? datos.valorPesos : undefined })
    );
    if (!acuerdo) return;

    reset(valoresIniciales());
    onRegistrado();
  }

  return (
    <Card titulo="Registrar acuerdo">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ui-formulario">
          <Campo etiqueta="Auspiciador *" error={errors.auspiciadorId?.message}>
            <select {...register("auspiciadorId")}>
              <option value="">Elige un auspiciador</option>
              {auspiciadores.map((auspiciador) => (
                <option key={auspiciador.id} value={auspiciador.id}>
                  {auspiciador.nombre} · {auspiciador.contacto}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Transmisión *" error={errors.transmisionId?.message || transmisiones.error}>
            <select {...register("transmisionId")}>
              <option value="">{transmisiones.cargando ? "Cargando transmisiones…" : "Elige una transmisión"}</option>
              {(transmisiones.datos ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombreEvento} · {NOMBRE_ESTADO[t.estado] ?? t.estado}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Tipo de aporte *" error={errors.tipo?.message}>
            <select {...register("tipo")}>
              <option value="DINERO">Dinero</option>
              <option value="CANJE">Canje</option>
            </select>
          </Campo>

          {tipo === "DINERO" ? (
            <Campo key="monto" etiqueta="Monto comprometido (en pesos) *" error={errors.valorPesos?.message}>
              <input type="number" min="1" step="1" {...register("valorPesos")} />
            </Campo>
          ) : (
            <Campo key="canje" etiqueta="Valor en pesos" ayuda="Lo ingresa el Contador al recibir el canje.">
              <input type="text" value="Al recibirlo" disabled />
            </Campo>
          )}

          <Campo etiqueta="Fecha comprometida *" error={errors.fechaComprometida?.message}>
            <input type="date" min={fechaDeHoy()} {...register("fechaComprometida")} />
          </Campo>

          <Campo
            etiqueta={tipo === "CANJE" ? "Qué entregará el auspiciador *" : "Descripción del acuerdo *"}
            anchoCompleto
            error={errors.descripcion?.message}
          >
            <textarea rows="2" {...register("descripcion")} />
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>Registrar acuerdo</Boton>
        </div>
      </form>
    </Card>
  );
}