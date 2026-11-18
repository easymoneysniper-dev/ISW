// Formulario para registrar un gasto con su comprobante (React Hook Form + Zod).
// Lo usa GastosPage.jsx. Avisa al padre con onGastoRegistrado para que recargue la lista.
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearGastoSchema, CATEGORIAS_GASTO } from "../../../schemas/gasto.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarGasto } from "../../../services/gastoService";
import { useAccion } from "../../../hooks/useAccion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import { NOMBRE_CATEGORIA_GASTO } from "../formato";

export default function RegistrarGastoForm({ transmisionId, onGastoRegistrado }) {
  // Si el backend rechaza el gasto (rendición ya completa, transmisión cotizada, etc.), queda en error.
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(crearGastoSchema),
    defaultValues: { categoria: "", fecha: fechaDeHoy() },
  });

  // Origen y destino solo se piden en la movilización.
  const esMovilizacion = useWatch({ control, name: "categoria" }) === "MOVILIZACION";

  async function onSubmit(datos) {
    const gasto = await ejecutar(() => registrarGasto(transmisionId, datos));
    if (!gasto) return;

    reset({ categoria: "", fecha: fechaDeHoy() });
    onGastoRegistrado();
  }

  return (
    <Card titulo="Registrar gasto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ui-formulario">
          <Campo etiqueta="Categoría *" error={errors.categoria?.message}>
            <select {...register("categoria")}>
              <option value="">Elige una categoría</option>
              {CATEGORIAS_GASTO.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {NOMBRE_CATEGORIA_GASTO[categoria]}
                </option>
              ))}
            </select>
          </Campo>

          {esMovilizacion && (
            <>
              <Campo etiqueta="Origen del viaje *" error={errors.origen?.message}>
                <input type="text" {...register("origen")} />
              </Campo>

              <Campo etiqueta="Destino del viaje *" error={errors.destino?.message}>
                <input type="text" {...register("destino")} />
              </Campo>
            </>
          )}

          <Campo etiqueta="Monto (en pesos) *" error={errors.monto?.message}>
            <input type="number" min="1" step="1" {...register("monto")} />
          </Campo>

          <Campo etiqueta="Fecha del gasto *" error={errors.fecha?.message}>
            <input type="date" max={fechaDeHoy()} {...register("fecha")} />
          </Campo>

          <Campo etiqueta="Comprobante *" ayuda="JPG, PNG o PDF, máx. 5 MB." error={errors.comprobante?.message}>
            <input type="file" accept="image/jpeg,image/png,application/pdf" {...register("comprobante")} />
          </Campo>

          <Campo etiqueta="Observación" anchoCompleto error={errors.observacion?.message}>
            <textarea rows="2" {...register("observacion")} />
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>Registrar gasto</Boton>
        </div>
      </form>
    </Card>
  );
}