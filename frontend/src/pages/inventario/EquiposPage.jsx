import { useEffect, useState } from "react";
import { listarEquipos, listarKits } from "../../services/equipoService";
import { useSesion } from "../../hooks/useSesion";
import EquipoForm from "./EquipoForm";
import ComprasEquipos from "./ComprasEquipos";
import { estadosEquipo, fecha, pesos } from "./equipo.utils";
import "./EquiposPage.css";

export default function EquiposPage() {
  const { usuario, sesionExpirada } = useSesion();
  const puedeEditar = ["JEFE_TECNICO", "ADMIN_DESARROLLO"].includes(usuario.rol);
  const [equipos, setEquipos] = useState([]);
  const [kits, setKits] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ficha, setFicha] = useState(null);
  const [vista, setVista] = useState("inventario");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([listarEquipos(), listarKits()]).then(([lista, listaKits]) => {
      if (activo) { setEquipos(lista); setKits(listaKits); }
    }).catch((err) => {
      if (!activo) return;
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [sesionExpirada]);

  async function actualizar() {
    setCargando(true); setError(""); setMensaje("");
    try {
      const [lista, listaKits] = await Promise.all([listarEquipos(), listarKits()]);
      setEquipos(lista); setKits(listaKits);
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setError(err.message);
    } finally { setCargando(false); }
  }

  function guardado(equipo) {
    setEquipos((lista) => [...lista.filter((item) => item.id !== equipo.id), equipo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    if (equipo.kit) setKits((lista) => [...lista.filter((item) => item.id !== equipo.kit.id), equipo.kit].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setMensaje(ficha?.id ? "Equipo actualizado correctamente." : "Equipo registrado. Su compra ya está incluida en el reporte mensual.");
    setFicha(null);
  }

  const visibles = equipos.filter((equipo) => (!estado || equipo.estado === estado) &&
    [equipo.nombre, equipo.marca, equipo.modelo, equipo.numeroSerie, equipo.kit?.nombre].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")));

  return <section className="equipos-page">
    <a href="#/inventario">← Inventario y kits</a>
    <div className="equipo-cabecera"><div><p className="menu-eyebrow">INVENTARIO GENERAL</p><h1>Equipos</h1><p>Consulta las fichas y mantén al día el estado de los equipos.</p></div><span className="etiqueta">{puedeEditar ? "Gestión de equipos" : "Solo consulta"}</span></div>
    <div className="equipo-vistas" aria-label="Secciones de equipos">
      <button aria-pressed={vista === "inventario"} onClick={() => setVista("inventario")}>Inventario</button>
      <button aria-pressed={vista === "compras"} disabled={ficha !== null} onClick={() => setVista("compras")}>Compras mensuales</button>
    </div>
    {vista === "compras" ? <ComprasEquipos /> : <>
      {mensaje && <p className="equipo-exito" role="status">{mensaje}</p>}
      {puedeEditar && ficha !== null && <EquipoForm key={ficha.id ?? "nuevo"} equipo={ficha.id ? ficha : null} kits={kits} onGuardado={guardado} onCancelar={() => setFicha(null)} />}
      <section className="equipo-panel" aria-labelledby="inventario-titulo">
        <div className="equipo-cabecera"><h2 id="inventario-titulo">Inventario general</h2><div className="equipo-botones">
          <button onClick={actualizar} disabled={cargando || ficha !== null}>Actualizar</button>
          {puedeEditar && <button className="equipo-primario" disabled={cargando || !!error || ficha !== null} onClick={() => { setFicha({}); setMensaje(""); }}>Registrar equipo</button>}
        </div></div>
        <div className="equipo-filtros">
          <label>Buscar equipo<input type="search" placeholder="Nombre, marca, modelo, serie o kit" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label>
          <label>Filtrar por estado<select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos los estados</option>{Object.entries(estadosEquipo).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select></label>
        </div>
        {cargando ? <p role="status">Cargando inventario…</p> : error ? <p className="menu-error" role="alert">{error}</p> : <>
          <p className="equipo-ayuda" role="status">Mostrando {visibles.length} de {equipos.length} {equipos.length === 1 ? "equipo" : "equipos"}</p>
          {!visibles.length ? <p className="equipo-vacio">{equipos.length ? "No hay equipos que coincidan con los filtros." : "Todavía no hay equipos registrados."}</p> :
            <div className="equipo-tabla-scroll" tabIndex={0} role="region" aria-label="Inventario de equipos">
              <table><caption className="equipo-sr">Equipos de la empresa</caption><thead><tr><th>Equipo</th><th>Serie</th><th>Compra</th><th>Estado</th><th>Kit / repuesto</th>{puedeEditar && <th>Acciones</th>}</tr></thead>
                <tbody>{visibles.map((equipo) => <tr key={equipo.id}>
                  <td><strong>{equipo.nombre}</strong><small>{[equipo.marca, equipo.modelo].filter(Boolean).join(" · ") || "Sin marca ni modelo"}</small></td>
                  <td>{equipo.numeroSerie || "Sin serie"}</td><td><span className="equipo-importe">{pesos(equipo.precioCompra)}</span><small>{fecha(equipo.fechaCompra)}</small></td>
                  <td><span className={`equipo-estado estado-${equipo.estado.toLowerCase()}`}>{estadosEquipo[equipo.estado]}</span></td><td>{equipo.kit?.nombre || "Repuesto suelto"}</td>
                  {puedeEditar && <td><button disabled={ficha !== null} aria-label={`Editar ${equipo.nombre}`} onClick={() => { setFicha(equipo); setMensaje(""); }}>Editar</button></td>}
                </tr>)}</tbody>
              </table>
            </div>}
        </>}
      </section>
    </>}
  </section>;
}
