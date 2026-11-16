// M1 · Registrar y cotizar una transmisión (RF 1.1 y 1.2): cliente registrado o nuevo, datos del evento,
// disponibilidad de personal y kits en ese horario, y vista previa de la cotización.
import { useState } from "react";
import { crearTransmision, consultarDisponibilidad } from "../../../services/transmisionService";
import { listarClientes } from "../../../services/clienteService";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { pesos } from "../../../utils/formato";
import { ZONAS, cotizacionPrevia, horarioAIso } from "../../../utils/transmision";
import { CATEGORIA_KIT } from "../transmisiones.utils";
import FichaTransmision from "../ficha/FichaTransmision";
import HorarioCampos from "../HorarioCampos";

const VACIO = {
  nombreEvento: "", lugar: "", zona: "LOCAL",
  cantidadCamaras: 1, tiempoTrasladoMin: 0, precioBase: "", ajuste: 0,
};
const CLIENTE_NUEVO = { nombre: "", telefono: "", email: "" };
const SIN_HORARIO = { fecha: "", horaInicio: "", horaTermino: "" };

export default function RegistrarPage() {
  const clientes = useFetch(listarClientes);
  const { ejecutar, guardando, error } = useAccion();
  const disponibilidad = useAccion();
  const [tipoCliente, setTipoCliente] = useState("registrado");
  const [clienteId, setClienteId] = useState("");
  const [nuevo, setNuevo] = useState(CLIENTE_NUEVO);
  const [datos, setDatos] = useState(VACIO);
  const [horario, setHorario] = useState(SIN_HORARIO);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [libres, setLibres] = useState(null);
  const [creada, setCreada] = useState(null);
  const [fichaAbierta, setFichaAbierta] = useState(false);

  const cambio = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    if (campo === "tiempoTrasladoMin") setLibres(null);
  };
  const cambiarHorario = (nuevoHorario) => { setHorario(nuevoHorario); setLibres(null); };
  const resultado = horarioAIso(horario);
  const horarioListo = !resultado.error;
  const horarioTocado = Boolean(horario.fecha && horario.horaInicio && horario.horaTermino);
  const previa = cotizacionPrevia({ ...datos, inicio: resultado.inicio, termino: resultado.termino });

  async function verDisponibilidad() {
    const respuesta = await disponibilidad.ejecutar(() => consultarDisponibilidad({
      inicio: resultado.inicio, termino: resultado.termino, tiempoTrasladoMin: datos.tiempoTrasladoMin,
    }));
    if (respuesta) setLibres(respuesta);
  }

  async function enviar(e) {
    e.preventDefault();
    setIntentoEnviar(true);
    if (!horarioListo) return;
    const cuerpo = {
      ...(tipoCliente === "registrado"
        ? { clienteId: Number(clienteId) }
        : { cliente: { nombre: nuevo.nombre, telefono: nuevo.telefono || null, email: nuevo.email || null } }),
      nombreEvento: datos.nombreEvento,
      inicio: resultado.inicio,
      termino: resultado.termino,
      lugar: datos.lugar,
      zona: datos.zona,
      cantidadCamaras: Number(datos.cantidadCamaras),
      tiempoTrasladoMin: Number(datos.tiempoTrasladoMin),
      precioBase: Number(datos.precioBase),
      ajuste: Number(datos.ajuste),
    };
    const respuesta = await ejecutar(() => crearTransmision(cuerpo));
    if (respuesta) {
      setCreada(respuesta);
      setDatos(VACIO);
      setHorario(SIN_HORARIO);
      setIntentoEnviar(false);
      setNuevo(CLIENTE_NUEVO);
      setClienteId("");
      setLibres(null);
      clientes.recargar();
    }
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/transmisiones", texto: "Transmisiones y cotización" }}
        eyebrow="Requisitos 1.1 y 1.2"
        titulo="Registrar y cotizar transmisión"
        descripcion="Registra la transmisión que pidió el cliente. Queda Cotizada con su precio y la indicación de adelanto."
      />

      {creada && (
        <Alerta tipo={creada.advertencias.length ? "advertencia" : "exito"}>
          Transmisión «{creada.nombreEvento}» registrada como Cotizada por {pesos(creada.precioCotizado)}
          {creada.requiereAdelanto ? ", requiere adelanto del 50 %" : ""}. {creada.advertencias.join(". ")}{" "}
          <Boton variante="texto" onClick={() => setFichaAbierta(true)}>Abrir ficha</Boton>
        </Alerta>
      )}

      <form onSubmit={enviar}>
        <fieldset disabled={guardando} className="ui-fieldset">
          <Card titulo="Cliente">
            <div className="ui-botones">
              <label className="ui-casilla">
                <input type="radio" name="tipoCliente" checked={tipoCliente === "registrado"} onChange={() => setTipoCliente("registrado")} />
                Cliente registrado
              </label>
              <label className="ui-casilla">
                <input type="radio" name="tipoCliente" checked={tipoCliente === "nuevo"} onChange={() => setTipoCliente("nuevo")} />
                Cliente nuevo
              </label>
            </div>
            {tipoCliente === "registrado" ? (
              <div className="ui-formulario">
                <Campo etiqueta="Cliente *" error={clientes.error}
                  ayuda={!clientes.cargando && !clientes.datos?.length ? "No hay clientes: elige «Cliente nuevo»." : undefined}>
                  <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={clientes.cargando}>
                    <option value="">{clientes.cargando ? "Cargando clientes…" : "Elige un cliente"}</option>
                    {(clientes.datos ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</option>
                    ))}
                  </select>
                </Campo>
              </div>
            ) : (
              <div className="ui-formulario">
                <Campo etiqueta="Nombre *"><input required maxLength={150} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
                <Campo etiqueta="Teléfono" ayuda="Teléfono o correo: al menos uno."><input type="tel" maxLength={30} value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} /></Campo>
                <Campo etiqueta="Correo"><input type="email" maxLength={254} value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></Campo>
              </div>
            )}
          </Card>

          <Card titulo="Evento" style={{ marginTop: 16 }}>
            <div className="ui-formulario">
              <Campo etiqueta="Nombre del evento *" anchoCompleto><input required maxLength={200} value={datos.nombreEvento} onChange={cambio("nombreEvento")} /></Campo>
              <HorarioCampos valor={horario} onCambiar={cambiarHorario} resultado={resultado} mostrarError={horarioTocado || intentoEnviar} />
              <Campo etiqueta="Lugar *"><input required maxLength={250} value={datos.lugar} onChange={cambio("lugar")} /></Campo>
              <Campo etiqueta="Zona *">
                <select value={datos.zona} onChange={cambio("zona")}>
                  {Object.entries(ZONAS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Cantidad de cámaras *"><input type="number" min={1} max={50} required value={datos.cantidadCamaras} onChange={cambio("cantidadCamaras")} /></Campo>
              <Campo etiqueta="Tiempo de traslado (min)" ayuda="Incluye, si corresponde, el retorno de los equipos a bodega.">
                <input type="number" min={0} max={1440} required value={datos.tiempoTrasladoMin} onChange={cambio("tiempoTrasladoMin")} />
              </Campo>
            </div>
          </Card>

          <Card
            titulo="Disponibilidad en ese horario"
            style={{ marginTop: 16 }}
            acciones={libres
              ? <Boton variante="secundario" onClick={() => setLibres(null)}>Ocultar disponibilidad</Boton>
              : <Boton variante="secundario" onClick={verDisponibilidad} cargando={disponibilidad.guardando} disabled={!horarioListo}>Ver disponibilidad</Boton>}
          >
            <Alerta tipo="error">{disponibilidad.error}</Alerta>
            {!libres ? <p className="ui-vacio">{horarioListo ? "Presiona «Ver disponibilidad»." : "Primero completa la fecha y las horas del evento."}</p> : (
              <div className="ui-formulario">
                <DataTable
                  titulo="Trabajadores disponibles"
                  datos={libres.trabajadores}
                  vacio="Ningún trabajador disponible en ese horario."
                  columnas={[
                    { titulo: `Trabajadores disponibles (${libres.trabajadores.length})`, render: (w) => <>{w.nombre}<small>{w.roles.join(", ")}</small></> },
                  ]}
                />
                <DataTable
                  titulo="Kits disponibles"
                  datos={libres.kits}
                  vacio="Ningún kit en condiciones y libre en ese horario."
                  columnas={[
                    { titulo: `Kits disponibles (${libres.kits.length})`, render: (k) => <>{k.nombre}<small>{CATEGORIA_KIT[k.categoria]}</small></> },
                  ]}
                />
              </div>
            )}
          </Card>

          <Card titulo="Cotización" style={{ marginTop: 16 }}>
            <div className="ui-formulario">
              <Campo etiqueta="Precio base ($) *"><input type="number" min={1} step={1} required value={datos.precioBase} onChange={cambio("precioBase")} /></Campo>
              <Campo etiqueta="Ajuste negociado ($)" ayuda="Puede ser cero o negativo (descuento).">
                <input type="number" step={1} required value={datos.ajuste} onChange={cambio("ajuste")} />
              </Campo>
            </div>
            <div className="ui-cifras">
              <div className="ui-cifra"><span>Precio cotizado (sin kits)</span><strong>{pesos(previa.precio)}</strong></div>
              <div className="ui-cifra">
                <span>Adelanto del 50 %</span>
                <strong>{previa.requiereAdelanto ? <Badge tono="advertencia">Requerido</Badge> : "No requerido"}</strong>
              </div>
            </div>
            <p className="ui-vacio">Los kits se asignan después en Inventario y kits → Asignar kits; su recargo se suma solo al precio.</p>
          </Card>
        </fieldset>

        <Alerta tipo="error">{error || (intentoEnviar && resultado.error)}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>Registrar transmisión</Boton>
        </div>
      </form>

      {fichaAbierta && creada && <FichaTransmision id={creada.id} onCerrar={() => setFichaAbierta(false)} />}
    </section>
  );
}
