// Formulario para registrar un auspiciador nuevo con su nombre y contacto.
// Lo usa AcuerdosPage.jsx. Avisa al padre con onRegistrado para que recargue la lista.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearAuspiciadorSchema } from "../../../schemas/auspiciador.schema";
import { registrarAuspiciador } from "../../../services/auspiciadorService";
import { useAccion } from "../../../hooks/useAccion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";

export default function RegistrarAuspiciadorForm({ onRegistrado }) {
  // Si el backend lo rechaza (por ejemplo, el auspiciador ya existe), queda en error.
  const { ejecutar, guardando, error } = useAccion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(crearAuspiciadorSchema) });

  async function onSubmit(datos) {
    const auspiciador = await ejecutar(() => registrarAuspiciador(datos));
    if (!auspiciador) return;

    reset();
    onRegistrado(auspiciador);
  }

  return (
    <Card titulo="Nuevo auspiciador">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ui-formulario">
          <Campo etiqueta="Nombre *" error={errors.nombre?.message}>
            <input type="text" {...register("nombre")} />
          </Campo>

          <Campo etiqueta="Contacto (teléfono o correo) *" error={errors.contacto?.message}>
            <input type="text" {...register("contacto")} />
          </Campo>
        </div>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>Registrar auspiciador</Boton>
        </div>
      </form>
    </Card>
  );
}