// Formulario para marcar un aporte como No cumplido con una observación (solo el Dueño).
// Lo usa AcuerdosPage.jsx con el aporte elegido en la tabla.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noCumplidoSchema } from "../../../schemas/auspiciador.schema";
import { marcarNoCumplido } from "../../../services/auspiciadorService";
import { ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function NoCumplidoForm({ aporte, onMarcado, onCancelar }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(noCumplidoSchema) });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await marcarNoCumplido(aporte.id, datos.observacion);
      onMarcado();
    } catch (error) {
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>
        Marcar No cumplido: {aporte.auspiciador.nombre} ({aporte.descripcion})
      </h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="observacionNoCumplido">Observación *</label>
        <textarea id="observacionNoCumplido" rows="2" {...register("observacion")} />
        {errors.observacion && <p role="alert" style={ESTILO_ERROR}>{errors.observacion.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Marcar No cumplido"}
      </button>{" "}
      <button type="button" onClick={onCancelar}>
        Cancelar
      </button>
    </form>
  );
}

export default NoCumplidoForm;