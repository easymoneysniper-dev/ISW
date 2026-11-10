// Formulario para registrar un gasto con su comprobante (Clase 7: React Hook Form + Zod).
// Lo usa GastosPage.jsx. Avisa al padre con onGastoRegistrado para que recargue la lista.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearGastoSchema, CATEGORIAS_GASTO } from "../../../schemas/gasto.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarGasto } from "../../../services/gastoService";
import { NOMBRE_CATEGORIA_GASTO, ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RegistrarGastoForm({ transmisionId, onGastoRegistrado }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(crearGastoSchema),
    defaultValues: { categoria: "", fecha: fechaDeHoy() },
  });

  // Origen y destino solo se piden en la movilización.
  const esMovilizacion = useWatch({ control, name: "categoria" }) === "MOVILIZACION";

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await registrarGasto(transmisionId, datos);
      reset({ categoria: "", fecha: fechaDeHoy() });
      onGastoRegistrado();
    } catch (error) {
      // Mensaje del backend: rendición ya completa, transmisión cotizada, etc.
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Registrar gasto</h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="categoria">Categoría *</label>
        <select id="categoria" {...register("categoria")}>
          <option value="">Elige una categoría</option>
          {CATEGORIAS_GASTO.map((categoria) => (
            <option key={categoria} value={categoria}>
              {NOMBRE_CATEGORIA_GASTO[categoria]}
            </option>
          ))}
        </select>
        {errors.categoria && <p role="alert" style={ESTILO_ERROR}>{errors.categoria.message}</p>}
      </div>

      {esMovilizacion && (
        <>
          <div style={ESTILO_CAMPO}>
            <label htmlFor="origen">Origen del viaje *</label>
            <input id="origen" type="text" {...register("origen")} />
            {errors.origen && <p role="alert" style={ESTILO_ERROR}>{errors.origen.message}</p>}
          </div>

          <div style={ESTILO_CAMPO}>
            <label htmlFor="destino">Destino del viaje *</label>
            <input id="destino" type="text" {...register("destino")} />
            {errors.destino && <p role="alert" style={ESTILO_ERROR}>{errors.destino.message}</p>}
          </div>
        </>
      )}

      <div style={ESTILO_CAMPO}>
        <label htmlFor="monto">Monto (en pesos) *</label>
        <input id="monto" type="number" min="1" step="1" {...register("monto")} />
        {errors.monto && <p role="alert" style={ESTILO_ERROR}>{errors.monto.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="fecha">Fecha del gasto *</label>
        <input id="fecha" type="date" max={fechaDeHoy()} {...register("fecha")} />
        {errors.fecha && <p role="alert" style={ESTILO_ERROR}>{errors.fecha.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="observacion">Observación</label>
        <textarea id="observacion" {...register("observacion")} />
        {errors.observacion && (
          <p role="alert" style={ESTILO_ERROR}>{errors.observacion.message}</p>
        )}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="comprobante">Comprobante (JPG, PNG o PDF, máx. 5 MB) *</label>
        <input
          id="comprobante"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register("comprobante")}
        />
        {errors.comprobante && (
          <p role="alert" style={ESTILO_ERROR}>{errors.comprobante.message}</p>
        )}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar gasto"}
      </button>
    </form>
  );
}

export default RegistrarGastoForm;
