// Ventana para marcar un aporte como No cumplido con una observación (solo el Dueño).
// La usa AcuerdosPage.jsx con el aporte elegido en la tabla.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noCumplidoSchema } from "../../../schemas/auspiciador.schema";
import { marcarNoCumplido } from "../../../services/auspiciadorService";
import { useAccion } from "../../../hooks/useAccion";
import Modal from "../../../components/ui/Modal";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";

export default function NoCumplidoForm({ aporte, onMarcado, onCancelar }) {
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(noCumplidoSchema) });

  async function onSubmit(datos) {
    const marcado = await ejecutar(() => marcarNoCumplido(aporte.id, datos.observacion));
    if (marcado) onMarcado();
  }

  return (
    <Modal abierto titulo="Marcar No cumplido" onCerrar={onCancelar}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p>
          <strong>{aporte.auspiciador.nombre}</strong> · {aporte.descripcion}
        </p>

        <div className="ui-formulario">
          <Campo etiqueta="Observación *" anchoCompleto error={errors.observacion?.message}>
            <textarea rows="3" {...register("observacion")} />
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" variante="peligro" cargando={guardando}>
            Marcar No cumplido
          </Boton>
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}