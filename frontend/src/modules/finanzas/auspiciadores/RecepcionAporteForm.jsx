// Formulario para registrar la recepción de un aporte con su comprobante (solo el Contador).
// Lo usa AportesPage.jsx con el aporte elegido en la tabla. Si es canje, pide su valor en pesos.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recepcionSchema } from "../../../schemas/auspiciador.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarRecepcion } from "../../../services/auspiciadorService";
import { formatearPesos, ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RecepcionAporteForm({ aporte, onRegistrada, onCancelar }) {
  const [errorServidor, setErrorServidor] = useState("");
  const esCanje = aporte.tipo === "CANJE";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recepcionSchema(aporte.tipo)),
    defaultValues: { fechaRecepcion: fechaDeHoy() },
  });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await registrarRecepcion(aporte.id, datos);
      onRegistrada();
    } catch (error) {
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>
        Registrar recepción: {aporte.auspiciador.nombre} ({aporte.descripcion})
      </h3>
      {!esCanje && <p>Monto comprometido: {formatearPesos(aporte.valorPesos)}</p>}

      <div style={ESTILO_CAMPO}>
        <label htmlFor="fechaRecepcion">Fecha de recepción *</label>
        <input id="fechaRecepcion" type="date" max={fechaDeHoy()} {...register("fechaRecepcion")} />
        {errors.fechaRecepcion && <p role="alert" style={ESTILO_ERROR}>{errors.fechaRecepcion.message}</p>}
      </div>

      {esCanje && (
        <div style={ESTILO_CAMPO}>
          <label htmlFor="valorCanje">Valor del canje (en pesos) *</label>
          <input id="valorCanje" type="number" min="1" step="1" {...register("valorPesos")} />
          {errors.valorPesos && <p role="alert" style={ESTILO_ERROR}>{errors.valorPesos.message}</p>}
        </div>
      )}

      <div style={ESTILO_CAMPO}>
        <label htmlFor="comprobanteAporte">
          {esCanje ? "Acta de recepción" : "Comprobante del abono"} (JPG, PNG o PDF, máx. 5 MB) *
        </label>
        <input
          id="comprobanteAporte"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register("comprobante")}
        />
        {errors.comprobante && <p role="alert" style={ESTILO_ERROR}>{errors.comprobante.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar recepción"}
      </button>{" "}
      <button type="button" onClick={onCancelar}>
        Cancelar
      </button>
    </form>
  );
}

export default RecepcionAporteForm;