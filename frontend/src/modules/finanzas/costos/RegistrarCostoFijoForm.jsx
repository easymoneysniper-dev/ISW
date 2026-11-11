// Formulario para registrar un costo fijo del mes elegido (Clase 7: React Hook Form + Zod).
// Lo usa CostosFijosPage.jsx. Avisa al padre con onCostoRegistrado para que recargue la lista.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearCostoFijoSchema } from "../../../schemas/costoFijo.schema";
import { registrarCostoFijo } from "../../../services/costoFijoService";
import { NOMBRE_MES, ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RegistrarCostoFijoForm({ anio, mes, onCostoRegistrado }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(crearCostoFijoSchema) });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await registrarCostoFijo({ ...datos, anio, mes });
      reset();
      onCostoRegistrado();
    } catch (error) {
      // Mensaje del backend, por ejemplo si el nombre ya existe en ese mes.
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>
        Agregar costo fijo de {NOMBRE_MES[mes - 1]} {anio}
      </h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="nombre">Nombre *</label>
        <input id="nombre" type="text" placeholder="Arriendo, internet, luz..." {...register("nombre")} />
        {errors.nombre && <p role="alert" style={ESTILO_ERROR}>{errors.nombre.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="monto">Monto (en pesos) *</label>
        <input id="monto" type="number" min="1" step="1" {...register("monto")} />
        {errors.monto && <p role="alert" style={ESTILO_ERROR}>{errors.monto.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Agregar costo fijo"}
      </button>
    </form>
  );
}

export default RegistrarCostoFijoForm;
