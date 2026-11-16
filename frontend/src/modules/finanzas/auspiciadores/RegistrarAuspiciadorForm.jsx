// Formulario para registrar un auspiciador nuevo con su nombre y contacto.
// Lo usa AcuerdosPage.jsx. Avisa al padre con onRegistrado para que recargue la lista.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearAuspiciadorSchema } from "../../../schemas/auspiciador.schema";
import { registrarAuspiciador } from "../../../services/auspiciadorService";
import { ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RegistrarAuspiciadorForm({ onRegistrado }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(crearAuspiciadorSchema) });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      const auspiciador = await registrarAuspiciador(datos);
      reset();
      onRegistrado(auspiciador);
    } catch (error) {
      // Mensaje del backend, por ejemplo si el auspiciador ya existe.
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Nuevo auspiciador</h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="nombreAuspiciador">Nombre *</label>
        <input id="nombreAuspiciador" type="text" {...register("nombre")} />
        {errors.nombre && <p role="alert" style={ESTILO_ERROR}>{errors.nombre.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="contactoAuspiciador">Contacto (teléfono o correo) *</label>
        <input id="contactoAuspiciador" type="text" {...register("contacto")} />
        {errors.contacto && <p role="alert" style={ESTILO_ERROR}>{errors.contacto.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar auspiciador"}
      </button>
    </form>
  );
}

export default RegistrarAuspiciadorForm;