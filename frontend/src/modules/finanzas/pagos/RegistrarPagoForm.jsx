// Formulario para registrar un pago con su comprobante (React Hook Form + Zod).
// Lo usa PagosPage.jsx. Avisa al padre con onPagoRegistrado para que recargue el resumen.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearPagoSchema } from "../../../schemas/pago.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarPago } from "../../../services/pagoService";
import { useAccion } from "../../../hooks/useAccion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";

export default function RegistrarPagoForm({ transmisionId, tipoSugerido, onPagoRegistrado }) {
  // Si el backend rechaza el pago (saldo superado, adelanto ya cubierto, etc.), queda en error.
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(crearPagoSchema),
    defaultValues: { tipo: tipoSugerido, fecha: fechaDeHoy(), medio: "TRANSFERENCIA" },
  });

  async function onSubmit(datos) {
    const pago = await ejecutar(() => registrarPago(transmisionId, datos));
    if (!pago) return;

    reset({ tipo: "SALDO", fecha: fechaDeHoy(), medio: "TRANSFERENCIA" });
    onPagoRegistrado();
  }

  return (
    <Card titulo="Registrar pago">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ui-formulario">
          <Campo etiqueta="Tipo *" error={errors.tipo?.message}>
            <select {...register("tipo")}>
              <option value="ADELANTO">Adelanto</option>
              <option value="SALDO">Saldo</option>
            </select>
          </Campo>

          <Campo etiqueta="Monto (en pesos) *" error={errors.monto?.message}>
            <input type="number" min="1" step="1" {...register("monto")} />
          </Campo>

          <Campo etiqueta="Fecha de recepción *" error={errors.fecha?.message}>
            <input type="date" max={fechaDeHoy()} {...register("fecha")} />
          </Campo>

          <Campo etiqueta="Medio de pago *" error={errors.medio?.message}>
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
          <Boton type="submit" cargando={guardando}>Registrar pago</Boton>
        </div>
      </form>
    </Card>
  );
}