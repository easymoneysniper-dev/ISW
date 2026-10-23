import { useState } from "react";
import { guardarEquipo } from "../../services/equipoService";
import { useSesion } from "../../hooks/useSesion";
import { estadosEquipo } from "./equipo.utils";

export default function EquipoForm({ equipo, kits, onGuardado, onCancelar }) {
  const { sesionExpirada } = useSesion();
  const [datos, setDatos] = useState({
    nombre: equipo?.nombre ?? "", marca: equipo?.marca ?? "", modelo: equipo?.modelo ?? "",
    numeroSerie: equipo?.numeroSerie ?? "", precioCompra: equipo?.precioCompra ?? "",
    fechaCompra: equipo?.fechaCompra.slice(0, 10) ?? "", estado: equipo?.estado ?? "DISPONIBLE",
    kitId: equipo?.kitId ? String(equipo.kitId) : "", nuevoKitNombre: "",
  });
  const [destino, setDestino] = useState(equipo?.kitId ? "existente" : "suelto");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (guardando) return;
    setError("");
    setGuardando(true);
    try {
      const guardado = await guardarEquipo({
        ...datos,
        kitId: destino === "existente" ? Number(datos.kitId) : null,
        nuevoKitNombre: destino === "nuevo" ? datos.nuevoKitNombre : null,
      }, equipo?.id);
      onGuardado(guardado);
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    } finally { setGuardando(false); }
  }

  return <section className="equipo-panel" aria-labelledby="ficha-titulo">
    <h2 id="ficha-titulo">{equipo ? "Editar equipo" : "Registrar equipo"}</h2>
    <p className="equipo-ayuda">Los campos con * son obligatorios. Los precios se expresan en pesos chilenos.</p>
    <form onSubmit={enviar}>
      <fieldset disabled={guardando} className="equipo-form-grid">
        <legend className="equipo-sr">Ficha del equipo</legend>
        <label>Nombre *<input autoFocus name="nombre" value={datos.nombre} onChange={cambiar} maxLength={150} required /></label>
        <label>Número de serie<input name="numeroSerie" value={datos.numeroSerie} onChange={cambiar} maxLength={150} placeholder="Opcional" /></label>
        <label>Marca<input name="marca" value={datos.marca} onChange={cambiar} maxLength={100} /></label>
        <label>Modelo<input name="modelo" value={datos.modelo} onChange={cambiar} maxLength={100} /></label>
        <label>Precio de compra (CLP) *<input name="precioCompra" type="number" min="1" max="99999999999999" step="1" value={datos.precioCompra} onChange={cambiar} required /></label>
        <label>Fecha de compra *<input name="fechaCompra" type="date" value={datos.fechaCompra} onChange={cambiar} required /></label>
        <label>Estado<select name="estado" value={datos.estado} onChange={cambiar}>
          {Object.entries(estadosEquipo).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select></label>
        <label>Ubicación en inventario<select value={destino} onChange={(e) => setDestino(e.target.value)}>
          <option value="suelto">Repuesto suelto</option>
          <option value="existente" disabled={!kits.length}>Dentro de un kit existente</option>
          <option value="nuevo">Dentro de un nuevo kit</option>
        </select></label>
        {destino === "existente" && <label>Kit *<select name="kitId" value={datos.kitId} onChange={cambiar} required>
          <option value="">Selecciona un kit</option>
          {kits.map((kit) => <option key={kit.id} value={kit.id}>{kit.nombre}</option>)}
        </select></label>}
        {destino === "nuevo" && <label>Nombre del nuevo kit *<input name="nuevoKitNombre" value={datos.nuevoKitNombre} onChange={cambiar} maxLength={150} required />
          <small>El kit se creará al guardar este equipo.</small>
        </label>}
      </fieldset>
      {error && <p className="menu-error" role="alert">{error}</p>}
      <div className="equipo-botones">
        <button className="equipo-primario" disabled={guardando} type="submit">{guardando ? "Guardando…" : equipo ? "Guardar cambios" : "Registrar equipo"}</button>
        <button type="button" disabled={guardando} onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  </section>;
}
