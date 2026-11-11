// M3 · Formulario de kit (RF 3.2).
import { useState } from "react";
import { guardarKit } from "../../../services/kitService";
import { useSesion } from "../../../hooks/useSesion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import DataTable from "../../../components/ui/DataTable";
import Badge from "../../../components/ui/Badge";
import { CATEGORIAS_KIT, ESTADOS_EQUIPO, TIPOS_EQUIPO, faltantes, tonoEstadoEquipo } from "../inventario.utils";

export default function KitForm({ kit, equipos, onGuardado, onCancelar }) {
  const { sesionExpirada } = useSesion();
  const [datos, setDatos] = useState({
    nombre: kit?.nombre ?? "",
    categoria: kit?.categoria ?? "ANTIGUO",
    enCondiciones: kit?.enCondiciones ?? false,
  });
  const [seleccion, setSeleccion] = useState(new Set(kit?.equipos.map((e) => e.id) ?? []));
  const [aceptaAdvertencia, setAceptaAdvertencia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Los equipos que ya son de este kit se muestran aunque no estén disponibles.
  const elegibles = equipos.filter((e) => (kit && e.kitId === kit.id) || (e.estado === "DISPONIBLE" && !e.kitId));
  const elegidos = elegibles.filter((e) => seleccion.has(e.id));
  const falta = faltantes(elegidos).map((tipo) => TIPOS_EQUIPO[tipo].toLowerCase());
  const exigeAceptar = datos.enCondiciones && falta.length > 0;

  function alternar(id) {
    setSeleccion((anterior) => {
      const nueva = new Set(anterior);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const guardado = await guardarKit(
        { ...datos, equipoIds: [...seleccion], aceptarAdvertencia: exigeAceptar && aceptaAdvertencia },
        kit?.id
      );
      onGuardado(guardado);
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card titulo={kit ? `Modificar ${kit.nombre}` : "Crear kit"}>
      <form onSubmit={enviar}>
        <fieldset disabled={guardando} className="ui-fieldset">
          <div className="ui-formulario">
            <Campo etiqueta="Nombre del kit *">
              <input value={datos.nombre} maxLength={150} required autoFocus
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
            </Campo>
            <Campo etiqueta="Clasificación *" ayuda="Define el recargo sobre el precio base de cada transmisión.">
              <select value={datos.categoria} onChange={(e) => setDatos({ ...datos, categoria: e.target.value })}>
                {Object.entries(CATEGORIAS_KIT).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
              </select>
            </Campo>
          </div>

          <h3 className="ui-subtitulo">Equipos del kit ({seleccion.size} seleccionados)</h3>
          <DataTable
            titulo="Equipos disponibles para el kit"
            datos={elegibles}
            vacio="No hay equipos disponibles sin kit. Registra o libera equipos en la pantalla Equipos."
            columnas={[
              { titulo: "Incluir", render: (e) => (
                <input type="checkbox" checked={seleccion.has(e.id)} onChange={() => alternar(e.id)}
                  aria-label={`Incluir ${e.nombre}`} />
              ) },
              { titulo: "Equipo", render: (e) => <><strong>{e.nombre}</strong><small>{[e.marca, e.modelo].filter(Boolean).join(" · ")}</small></> },
              { titulo: "Tipo", render: (e) => TIPOS_EQUIPO[e.tipo] },
              { titulo: "Serie", render: (e) => e.numeroSerie || "Sin serie" },
              { titulo: "Estado", render: (e) => <Badge tono={tonoEstadoEquipo(e.estado)}>{ESTADOS_EQUIPO[e.estado]}</Badge> },
            ]}
          />

          <label className="ui-casilla ui-casilla-separada">
            <input type="checkbox" checked={datos.enCondiciones}
              onChange={(e) => setDatos({ ...datos, enCondiciones: e.target.checked })} />
            El kit está en condiciones de salir a terreno
          </label>

          {falta.length > 0 && (
            <Alerta tipo="advertencia">
              A este kit le falta: <strong>{falta.join(", ")}</strong>.
              {datos.enCondiciones && (
                <label className="ui-casilla ui-casilla-separada">
                  <input type="checkbox" checked={aceptaAdvertencia} onChange={(e) => setAceptaAdvertencia(e.target.checked)} />
                  Acepto la advertencia y lo marco en condiciones de salir igual
                </label>
              )}
            </Alerta>
          )}
        </fieldset>

        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando} disabled={!seleccion.size || (exigeAceptar && !aceptaAdvertencia)}>
            {kit ? "Guardar cambios" : "Crear kit"}
          </Boton>
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>Cancelar</Boton>
        </div>
      </form>
    </Card>
  );
}
