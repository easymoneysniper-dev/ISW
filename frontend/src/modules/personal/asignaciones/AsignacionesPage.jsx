// M2 · Asignación de trabajadores y definición de comisiones (RF 2.3 y 2.4). Lo usa modules/personal/index.jsx. Llama a asignacionService y transmisionService.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import {
  obtenerContextoAsignacion,
  crearAsignacion,
  definirComision,
} from "../../../services/asignacionService";
import { pesos } from "../../../utils/formato";
import { NOMBRE_ESTADO } from "../../../utils/transmision";
import SelectorTransmision from "../../../components/SelectorTransmision";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import { ETIQUETAS_ROL, puedeGestionar } from "../personal.utils";

function AsignacionesDeTransmision({ transmisionId, tiempoTraslado, puedeEditar }) {
  const cargar = useCallback(
    () => obtenerContextoAsignacion(transmisionId, tiempoTraslado),
    [transmisionId, tiempoTraslado]
  );
  const { datos: contexto, cargando, error, recargar } = useFetch(cargar);
  const asignacionAccion = useAccion();
  const comisionAccion = useAccion();

  const [trabajadorId, setTrabajadorId] = useState("");
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
  const [porcentajeInicial, setPorcentajeInicial] = useState("");
  const [porcentajesEditados, setPorcentajesEditados] = useState({});
  const [errorValidacion, setErrorValidacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  if (cargando && !contexto) return <p role="status">Cargando asignaciones de la transmisión…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  if (!contexto) return null;

  const resumen = contexto.resumenComisiones;
  const trabajadorSeleccionado = contexto.candidatos.find(
    (c) => String(c.id) === String(trabajadorId)
  );
  const tieneAdvertencias = (trabajadorSeleccionado?.advertencias?.length ?? 0) > 0;

  function alternarRol(rol) {
    setRolesSeleccionados((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]
    );
  }

  async function enviarAsignacion(aceptarAdvertencia) {
    setErrorValidacion("");
    setMensaje("");

    if (!trabajadorId) {
      setErrorValidacion("Debes seleccionar un trabajador activo.");
      return;
    }

    if (rolesSeleccionados.length === 0) {
      setErrorValidacion("Debes seleccionar al menos un rol habilitado del trabajador.");
      return;
    }

    const creada = await asignacionAccion.ejecutar(() =>
      crearAsignacion({
        transmisionId,
        trabajadorId: Number(trabajadorId),
        roles: rolesSeleccionados,
        porcentajeComision: porcentajeInicial !== "" ? Number(porcentajeInicial) : null,
        tiempoTrasladoConfigMin: Number(tiempoTraslado),
        aceptarAdvertencia,
      })
    );

    if (!creada) return;

    setMensaje("Trabajador asignado correctamente a la transmisión.");
    setTrabajadorId("");
    setRolesSeleccionados([]);
    setPorcentajeInicial("");
    recargar();
  }

  async function guardarComisionFila(asignacion) {
    setErrorValidacion("");
    setMensaje("");
    const valorActual =
      porcentajesEditados[asignacion.id] ??
      (asignacion.porcentajeComision !== null && asignacion.porcentajeComision !== undefined
        ? String(asignacion.porcentajeComision)
        : "");

    if (valorActual === "" || Number(valorActual) <= 0 || Number(valorActual) > 100) {
      setErrorValidacion("Ingresa un porcentaje de comisión válido entre 0,01 % y 100 %.");
      return;
    }

    const actualizada = await comisionAccion.ejecutar(() =>
      definirComision(asignacion.id, Number(valorActual))
    );

    if (!actualizada) return;

    setMensaje("Porcentaje de comisión actualizado.");
    setPorcentajesEditados((prev) => {
      const siguiente = { ...prev };
      delete siguiente[asignacion.id];
      return siguiente;
    });
    recargar();
  }

  return (
    <>
      <Alerta tipo="exito">{mensaje}</Alerta>
      <Alerta tipo="error">{errorValidacion || asignacionAccion.error || comisionAccion.error}</Alerta>

      <div className="ui-cifras">
        <div className="ui-cifra">
          <span>Precio cotizado</span>
          <strong>{pesos(resumen?.precioCotizado)}</strong>
        </div>
        <div className="ui-cifra">
          <span>Suma de porcentajes</span>
          <strong>{resumen?.sumaPorcentajes ?? 0} %</strong>
        </div>
        <div className="ui-cifra">
          <span>Total comisiones</span>
          <strong>{pesos(resumen?.totalComisiones)}</strong>
        </div>
        <div className="ui-cifra">
          <span>Restante antes de otros gastos</span>
          <strong>{pesos(resumen?.montoRestante)}</strong>
        </div>
      </div>

      {puedeEditar && (
        <Card titulo={`Asignar trabajador a «${contexto.transmision.nombreEvento}»`}>
          {contexto.transmision.estado !== "CONFIRMADA" && (
            <Alerta tipo="advertencia">
              Esta transmisión está en estado{" "}
              <strong>{NOMBRE_ESTADO[contexto.transmision.estado] ?? contexto.transmision.estado}</strong>.
              Solo las transmisiones Confirmadas admiten nuevas asignaciones.
            </Alerta>
          )}

          <fieldset disabled={asignacionAccion.guardando} className="ui-fieldset">
            <div className="ui-formulario">
              <Campo etiqueta="Trabajador activo (disponibles primero) *">
                <select
                  value={trabajadorId}
                  onChange={(e) => {
                    setTrabajadorId(e.target.value);
                    setRolesSeleccionados([]);
                    setErrorValidacion("");
                    asignacionAccion.limpiarError();
                  }}
                >
                  <option value="">Selecciona un trabajador activo…</option>
                  {contexto.candidatos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.disponible ? "[Disponible] " : "[Con advertencia] "}
                      {c.nombre} — {c.roles.map((r) => ETIQUETAS_ROL[r] || r).join(", ")}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo etiqueta="% Comisión inicial (opcional)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={porcentajeInicial}
                  onChange={(e) => setPorcentajeInicial(e.target.value)}
                  placeholder="Ej: 10"
                />
              </Campo>
            </div>

            {trabajadorSeleccionado && (
              <>
                <h3 className="ui-subtitulo">Roles que desempeñará en la transmisión *</h3>
                <div className="ui-botones">
                  {trabajadorSeleccionado.roles.map((rol) => (
                    <label key={rol} className="ui-casilla">
                      <input
                        type="checkbox"
                        checked={rolesSeleccionados.includes(rol)}
                        onChange={() => alternarRol(rol)}
                      />
                      {ETIQUETAS_ROL[rol] || rol}
                    </label>
                  ))}
                </div>

                {tieneAdvertencias && (
                  <Alerta tipo="advertencia">
                    <strong>Advertencia de disponibilidad, horario o traslado:</strong>{" "}
                    {trabajadorSeleccionado.advertencias.join(". ")}
                  </Alerta>
                )}
              </>
            )}
          </fieldset>

          <div className="ui-botones">
            <Boton
              cargando={asignacionAccion.guardando}
              onClick={() => enviarAsignacion(tieneAdvertencias)}
            >
              {tieneAdvertencias ? "Aceptar advertencia y asignar" : "Asignar trabajador"}
            </Boton>
          </div>
        </Card>
      )}

      <Card
        titulo={`Personal asignado y comisiones (${contexto.asignaciones.length})`}
        acciones={
          <Boton variante="secundario" onClick={recargar} disabled={cargando}>
            Actualizar
          </Boton>
        }
      >
        <DataTable
          titulo="Personal asignado y comisiones"
          datos={contexto.asignaciones}
          vacio="Aún no hay trabajadores asignados a esta transmisión."
          columnas={[
            { titulo: "Trabajador", render: (a) => <strong>{a.trabajador?.nombre}</strong> },
            {
              titulo: "Roles en el evento",
              render: (a) =>
                a.roles.map((r) => (
                  <Badge key={r} tono="info">
                    {ETIQUETAS_ROL[r] || r}
                  </Badge>
                )),
            },
            {
              titulo: "% Comisión",
              render: (a) => {
                const valor =
                  porcentajesEditados[a.id] ??
                  (a.porcentajeComision !== null && a.porcentajeComision !== undefined
                    ? String(a.porcentajeComision)
                    : "");
                if (!puedeEditar) {
                  return a.porcentajeComision ? `${a.porcentajeComision} %` : "Sin definir";
                }
                return (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    className="ui-select-compacto"
                    aria-label={`Porcentaje de comisión de ${a.trabajador?.nombre}`}
                    value={valor}
                    onChange={(e) =>
                      setPorcentajesEditados((prev) => ({ ...prev, [a.id]: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                );
              },
            },
            {
              titulo: "Monto comisión",
              numero: true,
              render: (a) => <strong>{pesos(a.montoComision)}</strong>,
            },
            ...(puedeEditar
              ? [
                  {
                    titulo: "Acción",
                    render: (a) => (
                      <Boton
                        variante="secundario"
                        cargando={comisionAccion.guardando}
                        onClick={() => guardarComisionFila(a)}
                      >
                        Guardar %
                      </Boton>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </>
  );
}

export default function AsignacionesPage() {
  const { usuario } = useSesion();
  const puedeEditar = puedeGestionar(usuario?.rol);
  const [transmisionId, setTransmisionId] = useState(null);
  const [trasladoInput, setTrasladoInput] = useState("60");
  const [trasladoAplicado, setTrasladoAplicado] = useState(60);

  function aplicarTraslado(e) {
    e.preventDefault();
    const valor = Math.max(0, Number(trasladoInput) || 0);
    setTrasladoAplicado(valor);
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/personal", texto: "Personal y asignaciones" }}
        eyebrow="Requisitos 2.3 y 2.4"
        titulo="Asignaciones y porcentajes"
        descripcion="Asigna trabajadores activos a transmisiones confirmadas y define el porcentaje de comisión sobre el precio cotizado."
        extra={<Badge tono="info">{puedeEditar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Card titulo="Transmisión y traslado">
        <form className="ui-filtros" onSubmit={aplicarTraslado}>
          <SelectorTransmision
            valor={transmisionId}
            onCambiar={setTransmisionId}
            ayuda="Las nuevas asignaciones requieren una transmisión en estado Confirmada."
          />
          <Campo etiqueta="Traslado entre recintos (min)">
            <input
              type="number"
              min="0"
              value={trasladoInput}
              onChange={(e) => setTrasladoInput(e.target.value)}
            />
          </Campo>
          <Boton type="submit" variante="secundario">
            Aplicar
          </Boton>
        </form>
      </Card>

      {transmisionId ? (
        <AsignacionesDeTransmision
          key={transmisionId}
          transmisionId={transmisionId}
          tiempoTraslado={trasladoAplicado}
          puedeEditar={puedeEditar}
        />
      ) : (
        <p className="ui-vacio">Elige una transmisión para gestionar su personal y comisiones.</p>
      )}
    </section>
  );
}