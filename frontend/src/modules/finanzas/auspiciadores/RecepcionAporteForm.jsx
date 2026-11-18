// Ventana para registrar la recepción de un aporte con su comprobante (solo el Contador).
// La usa AportesPage.jsx con el aporte elegido en la tabla. Si es canje, pide su valor en pesos.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recepcionSchema } from "../../../schemas/auspiciador.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarRecepcion } from "../../../services/auspiciadorService";
import { useAccion } from "../../../hooks/useAccion";
import Modal from "../../../components/ui/Modal";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import { formatearPesos } from "../formato";

export default function RecepcionAporteForm({ aporte, onRegistrada, onCancelar }) {
  const { ejecutar, guardando, error } = useAccion();
  const esCanje = aporte.tipo === "CANJE";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recepcionSchema(aporte.tipo)),
    defaultValues: { fechaRecepcion: fechaDeHoy() },
  });

  async function onSubmit(datos) {
    const recibido = await ejecutar(() => registrarRecepcion(aporte.id, datos));
    if (recibido) onRegistrada();
  }

  return (
    <Modal abierto titulo="Registrar recepción" onCerrar={onCancelar}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p>
          <strong>{aporte.auspiciador.nombre}</strong> · {aporte.descripcion}
          {!esCanje && <> · Monto comprometido: {formatearPesos(aporte.valorPesos)}</>}
        </p>

        <div className="ui-formulario">
          <Campo etiqueta="Fecha de recepción *" error={errors.fechaRecepcion?.message}>
            <input type="date" max={fechaDeHoy()} {...register("fechaRecepcion")} />
          </Campo>

          {esCanje && (
            <Campo etiqueta="Valor del canje (en pesos) *" error={errors.valorPesos?.message}>
              <input type="number" min="1" step="1" {...register("valorPesos")} />
            </Campo>
          )}

          <Campo
            etiqueta={esCanje ? "Acta de recepción *" : "Comprobante del abono *"}
            ayuda="JPG, PNG o PDF, máx. 5 MB."
            error={errors.comprobante?.message}
          >
            <input type="file" accept="image/jpeg,image/png,application/pdf" {...register("comprobante")} />
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>
            Registrar recepción
          </Boton>
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}