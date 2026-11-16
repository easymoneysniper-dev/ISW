// Formulario para registrar la devolución del adelanto con su comprobante.
// Lo usa DevolucionAdelanto.jsx. Avisa al padre con onDevolucionRegistrada para que recargue.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearDevolucionSchema } from "../../../schemas/devolucion.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarDevolucion } from "../../../services/devolucionService";
import { ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RegistrarDevolucionForm({ transmisionId, montoSugerido, onDevolucionRegistrada }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(crearDevolucionSchema),
    defaultValues: { monto: montoSugerido, fecha: fechaDeHoy(), medio: "TRANSFERENCIA" },
  });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await registrarDevolucion(transmisionId, datos);
      onDevolucionRegistrada();
    } catch (error) {
      // Mensaje del backend: monto mayor a lo pagado, devolución ya registrada, etc.
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h4>Registrar devolución</h4>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="montoDevolucion">Monto devuelto (en pesos) *</label>
        <input id="montoDevolucion" type="number" min="1" step="1" {...register("monto")} />
        {errors.monto && <p role="alert" style={ESTILO_ERROR}>{errors.monto.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="fechaDevolucion">Fecha de la devolución *</label>
        <input id="fechaDevolucion" type="date" max={fechaDeHoy()} {...register("fecha")} />
        {errors.fecha && <p role="alert" style={ESTILO_ERROR}>{errors.fecha.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="medioDevolucion">Medio *</label>
        <select id="medioDevolucion" {...register("medio")}>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="EFECTIVO">Efectivo</option>
        </select>
        {errors.medio && <p role="alert" style={ESTILO_ERROR}>{errors.medio.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="comprobanteDevolucion">Comprobante (JPG, PNG o PDF, máx. 5 MB) *</label>
        <input
          id="comprobanteDevolucion"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register("comprobante")}
        />
        {errors.comprobante && <p role="alert" style={ESTILO_ERROR}>{errors.comprobante.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar devolución"}
      </button>
    </form>
  );
}

export default RegistrarDevolucionForm;