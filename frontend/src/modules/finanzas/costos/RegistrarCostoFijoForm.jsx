// Formulario para registrar un costo fijo del mes elegido (React Hook Form + Zod).
// Lo usa CostosFijosPage.jsx. Avisa al padre con onCostoRegistrado para que recargue la lista.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearCostoFijoSchema } from "../../../schemas/costoFijo.schema";
import { registrarCostoFijo } from "../../../services/costoFijoService";
import { useAccion } from "../../../hooks/useAccion";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import { NOMBRE_MES } from "../formato";

export default function RegistrarCostoFijoForm({ anio, mes, onCostoRegistrado }) {
  // Si el backend lo rechaza (por ejemplo, el nombre ya existe en ese mes), queda en error.
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(crearCostoFijoSchema) });

  async function onSubmit(datos) {
    const costo = await ejecutar(() => registrarCostoFijo({ ...datos, anio, mes }));
    if (!costo) return;

    reset();
    onCostoRegistrado();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3 className="ui-subtitulo">
        Agregar costo fijo de {NOMBRE_MES[mes - 1]} {anio}
      </h3>

      <div className="ui-formulario">
        <Campo etiqueta="Nombre *" error={errors.nombre?.message}>
          <input type="text" placeholder="Arriendo, internet, luz..." {...register("nombre")} />
        </Campo>

        <Campo etiqueta="Monto (en pesos) *" error={errors.monto?.message}>
          <input type="number" min="1" step="1" {...register("monto")} />
        </Campo>
      </div>

      <Alerta tipo="error">{error}</Alerta>
      <div className="ui-botones">
        <Boton type="submit" cargando={guardando}>Agregar costo fijo</Boton>
      </div>
    </form>
  );
}