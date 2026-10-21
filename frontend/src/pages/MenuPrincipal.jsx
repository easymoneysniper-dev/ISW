import { useEffect, useState } from "react";
import { useSesion } from "../hooks/useSesion";
import { modulosPermitidos, accionesPermitidas, nombresRoles, resolverRuta } from "../config/modulos";
import Transmisiones from "../modules/transmisiones";
import Personal from "../modules/personal";
import Inventario from "../modules/inventario";
import Finanzas from "../modules/finanzas";
import "./MenuPrincipal.css";

const pantallas = { transmisiones: Transmisiones, personal: Personal, inventario: Inventario, finanzas: Finanzas };

export default function MenuPrincipal() {
  const { usuario, cerrarSesion } = useSesion();
  const [hash, setHash] = useState(window.location.hash);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    function navegar() { setHash(window.location.hash); }
    window.addEventListener("hashchange", navegar);
    return () => window.removeEventListener("hashchange", navegar);
  }, []);
  const ruta = resolverRuta(hash, usuario.rol);
  const disponibles = modulosPermitidos(usuario.rol);
  const Pantalla = ruta.modulo ? pantallas[ruta.modulo.id] : null;

  async function salir() {
    setError("");
    setCerrando(true);
    try {
      await cerrarSesion();
      window.location.hash = "/";
    } catch {
      setError("No se pudo cerrar la sesión. Intenta nuevamente.");
    } finally { setCerrando(false); }
  }

  return <div className="menu-app">
    <header className="menu-header">
      <a className="menu-brand" href="#/">CENTRAL EN VIVO<span>Gestión de transmisiones</span></a>
      <div className="menu-cuenta"><span>{usuario.nombre}<small>{nombresRoles[usuario.rol] || "Rol sin acceso"}</small></span>
        <button onClick={salir} disabled={cerrando}>{cerrando ? "Cerrando…" : "Cerrar sesión"}</button>
      </div>
    </header>
    <nav className="menu-nav" aria-label="Navegación principal">
      <a href="#/" aria-current={ruta.tipo === "inicio" ? "page" : undefined}>Inicio</a>
      {disponibles.map((modulo) => <a key={modulo.id} href={`#/${modulo.id}`} aria-current={ruta.modulo?.id === modulo.id ? "page" : undefined}>{modulo.titulo}</a>)}
    </nav>
    <main className="menu-main">
      {error && <p role="alert" className="menu-error">{error}</p>}
      {ruta.tipo === "inicio" ? <>
        <p className="menu-eyebrow">TU ESPACIO DE TRABAJO</p>
        <h1>Bienvenido, {usuario.nombre}</h1>
        <p>Selecciona un módulo para continuar. Verás las opciones disponibles para tu rol.</p>
        <div className="menu-grid">{disponibles.map((modulo, i) => <a className="menu-card" href={`#/${modulo.id}`} key={modulo.id}>
          <span className="menu-numero">0{i + 1}</span><h2>{modulo.titulo}</h2><p>{modulo.descripcion}</p>
          <small>{accionesPermitidas(modulo, usuario.rol).length} secciones · {accionesPermitidas(modulo, usuario.rol).some((accion) => accion.disponible) ? "Con funciones disponibles" : "En preparación"}</small>
          <span className="menu-link">Entrar al módulo →</span>
        </a>)}</div>
        {["DUENO", "ADMIN_DESARROLLO"].includes(usuario.rol) && <a className="menu-resumen" href="#/finanzas/resumen">Consultar resumen mensual → <small>En preparación</small></a>}
        {disponibles.length === 0 && <p role="alert">Tu rol no tiene módulos habilitados. Contacta al administrador.</p>}
      </> : Pantalla ? <Pantalla modulo={ruta.modulo} accion={ruta.accion} rol={usuario.rol} /> : <section>
        <h1>{ruta.tipo === "prohibida" ? "Acceso no permitido" : "Página no encontrada"}</h1>
        <p>{ruta.tipo === "prohibida" ? "Esta sección no está disponible para tu rol." : "Revisa la dirección o vuelve al inicio."}</p>
        <a href="#/">Volver al menú principal</a>
      </section>}
    </main>
    <footer className="menu-footer">Central en Vivo · Sistema de gestión</footer>
  </div>;
}
