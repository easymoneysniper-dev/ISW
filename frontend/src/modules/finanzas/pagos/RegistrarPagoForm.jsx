// Formulario para registrar un pago con su comprobante (Clase 7: React Hook Form + Zod).
// Lo usa PagosPage.jsx. Avisa al padre con onPagoRegistrado para que recargue el resumen.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearPagoSchema } from "../../../schemas/pago.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarPago } from "../../../services/pagoService";
import { ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function RegistrarPagoForm({ transmisionId, tipoSugerido, onPagoRegistrado }) {
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(crearPagoSchema),
    defaultValues: { tipo: tipoSugerido, fecha: fechaDeHoy(), medio: "TRANSFERENCIA" },
  });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      await registrarPago(transmisionId, datos);
      reset({ tipo: "SALDO", fecha: fechaDeHoy(), medio: "TRANSFERENCIA" });
      onPagoRegistrado();
    } catch (error) {
      // Mensaje del backend: saldo superado, adelanto ya cubierto, etc.
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Registrar pago</h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="tipo">Tipo *</label>
        <select id="tipo" {...register("tipo")}>
          <option value="ADELANTO">Adelanto</option>
          <option value="SALDO">Saldo</option>
        </select>
        {errors.tipo && <p role="alert" style={ESTILO_ERROR}>{errors.tipo.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="monto">Monto (en pesos) *</label>
        <input id="monto" type="number" min="1" step="1" {...register("monto")} />
        {errors.monto && <p role="alert" style={ESTILO_ERROR}>{errors.monto.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="fecha">Fecha de recepción *</label>
        <input id="fecha" type="date" max={fechaDeHoy()} {...register("fecha")} />
        {errors.fecha && <p role="alert" style={ESTILO_ERROR}>{errors.fecha.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="medio">Medio de pago *</label>
        <select id="medio" {...register("medio")}>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="EFECTIVO">Efectivo</option>
        </select>
        {errors.medio && <p role="alert" style={ESTILO_ERROR}>{errors.medio.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="comprobante">Comprobante (JPG, PNG o PDF, máx. 5 MB) *</label>
        <input
          id="comprobante"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register("comprobante")}
        />
        {errors.comprobante && <p role="alert" style={ESTILO_ERROR}>{errors.comprobante.message}</p>}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar pago"}
      </button>
    </form>
  );
}

export default RegistrarPagoForm;
