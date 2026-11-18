// Formulario para registrar la devolución del adelanto con su comprobante.
// Lo usa DevolucionAdelanto.jsx. Avisa al padre con onDevolucionRegistrada para que recargue.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearDevolucionSchema } from "../../../schemas/devolucion.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarDevolucion } from "../../../services/devolucionService";
import { useAccion } from "../../../hooks/useAccion";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";

export default function RegistrarDevolucionForm({ transmisionId, montoSugerido, onDevolucionRegistrada }) {
  // Si el backend la rechaza (monto mayor a lo pagado, ya registrada, etc.), queda en error.
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(crearDevolucionSchema),
    defaultValues: { monto: montoSugerido, fecha: fechaDeHoy(), medio: "TRANSFERENCIA" },
  });

  async function onSubmit(datos) {
    const devolucion = await ejecutar(() => registrarDevolucion(transmisionId, datos));
    if (devolucion) onDevolucionRegistrada();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3 className="ui-subtitulo">Registrar devolución</h3>

      <div className="ui-formulario">
        <Campo etiqueta="Monto devuelto (en pesos) *" error={errors.monto?.message}>
          <input type="number" min="1" step="1" {...register("monto")} />
        </Campo>

        <Campo etiqueta="Fecha de la devolución *" error={errors.fecha?.message}>
          <input type="date" max={fechaDeHoy()} {...register("fecha")} />
        </Campo>

        <Campo etiqueta="Medio *" error={errors.medio?.message}>
          <select {...register("medio")}>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="EFECTIVO">Efectivo</option>
          </select>
        </Campo>

        <Campo etiqueta="Comprobante *" ayuda="JPG, PNG o PDF, máx. 5 MB." error={errors.comprobante?.message}>
          <input type="file" accept="image/jpeg,image/png,application/pdf" {...register("comprobante")} />
        </Campo>
      </div>

      <Alerta tipo="error">{error}</Alerta>
      <div className="ui-botones">
        <Boton type="submit" cargando={guardando}>Registrar devolución</Boton>
      </div>
    </form>
  );
}