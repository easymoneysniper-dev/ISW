// Formulario para registrar un acuerdo con un auspiciador.
// Lo usa AcuerdosPage.jsx, que le pasa los auspiciadores. El acuerdo queda Comprometido.
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearAcuerdoSchema } from "../../../schemas/auspiciador.schema";
import { fechaDeHoy } from "../../../schemas/comprobante.schema";
import { registrarAcuerdo } from "../../../services/auspiciadorService";
import { listarTransmisiones } from "../../../services/transmisionService";
import { ESTILO_CAMPO, ESTILO_ERROR } from "../formato";

function valoresIniciales() {
  return { tipo: "DINERO", fechaComprometida: fechaDeHoy() };
}

function RegistrarAcuerdoForm({ auspiciadores, onRegistrado, onError }) {
  const [transmisiones, setTransmisiones] = useState([]);
  const [errorServidor, setErrorServidor] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(crearAcuerdoSchema),
    defaultValues: valoresIniciales(),
    // Si se cambia a canje, el campo del monto se oculta y su valor se descarta.
    shouldUnregister: true,
  });

  useEffect(() => {
    listarTransmisiones().then(setTransmisiones).catch(onError);
  }, [onError]);

  const tipo = useWatch({ control, name: "tipo" });

  async function onSubmit(datos) {
    setErrorServidor("");

    try {
      // Si es canje, el valor en pesos se ingresa al recibirlo.
      await registrarAcuerdo({ ...datos, valorPesos: datos.tipo === "DINERO" ? datos.valorPesos : undefined });
      reset(valoresIniciales());
      onRegistrado();
    } catch (error) {
      setErrorServidor(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Registrar acuerdo</h3>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="auspiciadorAcuerdo">Auspiciador *</label>
        <select id="auspiciadorAcuerdo" {...register("auspiciadorId")}>
          <option value="">Elige un auspiciador</option>
          {auspiciadores.map((auspiciador) => (
            <option key={auspiciador.id} value={auspiciador.id}>
              {auspiciador.nombre} · {auspiciador.contacto}
            </option>
          ))}
        </select>
        {errors.auspiciadorId && <p role="alert" style={ESTILO_ERROR}>{errors.auspiciadorId.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="transmisionAcuerdo">Transmisión *</label>
        <select id="transmisionAcuerdo" {...register("transmisionId")}>
          <option value="">Elige una transmisión</option>
          {transmisiones.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombreEvento} · {t.estado}
            </option>
          ))}
        </select>
        {errors.transmisionId && <p role="alert" style={ESTILO_ERROR}>{errors.transmisionId.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="tipoAporte">Tipo de aporte *</label>
        <select id="tipoAporte" {...register("tipo")}>
          <option value="DINERO">Dinero</option>
          <option value="CANJE">Canje</option>
        </select>
        {errors.tipo && <p role="alert" style={ESTILO_ERROR}>{errors.tipo.message}</p>}
      </div>

      <div style={ESTILO_CAMPO}>
        <label htmlFor="descripcionAcuerdo">
          {tipo === "CANJE" ? "Qué entregará el auspiciador *" : "Descripción del acuerdo *"}
        </label>
        <textarea id="descripcionAcuerdo" rows="2" {...register("descripcion")} />
        {errors.descripcion && <p role="alert" style={ESTILO_ERROR}>{errors.descripcion.message}</p>}
      </div>

      {tipo === "DINERO" ? (
        <div style={ESTILO_CAMPO}>
          <label htmlFor="valorAcuerdo">Monto comprometido (en pesos) *</label>
          <input id="valorAcuerdo" type="number" min="1" step="1" {...register("valorPesos")} />
          {errors.valorPesos && <p role="alert" style={ESTILO_ERROR}>{errors.valorPesos.message}</p>}
        </div>
      ) : (
        <p>El valor en pesos del canje lo ingresa el Contador al recibirlo.</p>
      )}

      <div style={ESTILO_CAMPO}>
        <label htmlFor="fechaComprometida">Fecha comprometida *</label>
        <input id="fechaComprometida" type="date" min={fechaDeHoy()} {...register("fechaComprometida")} />
        {errors.fechaComprometida && (
          <p role="alert" style={ESTILO_ERROR}>{errors.fechaComprometida.message}</p>
        )}
      </div>

      {errorServidor && <p role="alert" style={ESTILO_ERROR}>{errorServidor}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar acuerdo"}
      </button>
    </form>
  );
}

export default RegistrarAcuerdoForm;