// Pantalla principal: saludo, botón de cerrar sesión y lista de transmisiones.
// Pide los datos con services/ y lee la sesión con useSesion().
import { useEffect, useState } from "react";
import { useSesion } from "../hooks/useSesion";
import { listarTransmisiones } from "../services/transmisionService";
import { comprobarBackend } from "../services/healthService";

function TransmisionesPage() {
  const { usuario, cerrarSesion, sesionExpirada } = useSesion();
  const [mensaje, setMensaje] = useState("Conectando...");
  const [transmisiones, setTransmisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState("");

  // Al abrir la pantalla: comprueba el backend y carga las transmisiones.
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      comprobarBackend()
        .then((texto) => activo && setMensaje(texto))
        .catch(() => activo && setMensaje("Error al conectar con el backend"));

      try {
        const datos = await listarTransmisiones();
        if (activo) setTransmisiones(datos);
      } catch (error) {
        if (!activo) return;

        // 401: la sesión venció, se vuelve al login.
        if (error.status === 401) {
          sesionExpirada();
          return;
        }

        setError(error.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [sesionExpirada]);

  async function manejarCerrarSesion() {
    setCerrandoSesion(true);
    setErrorSesion("");

    try {
      await cerrarSesion();
    } catch {
      setErrorSesion("No se pudo cerrar la sesión. Intenta nuevamente.");
      setCerrandoSesion(false);
    }
  }

  return (
    <main>
      <h1>Sistema de Gestión de Transmisiones</h1>

      <p>Bienvenido, {usuario.nombre}</p>
      <button type="button" onClick={manejarCerrarSesion} disabled={cerrandoSesion}>
        {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>

      {errorSesion && <p role="alert">{errorSesion}</p>}
      <p>{mensaje}</p>

      <section>
        <h2>Transmisiones registradas</h2>

        {cargando && <p>Cargando transmisiones...</p>}

        {error && <p role="alert">{error}</p>}

        {!cargando && !error && transmisiones.length === 0 && (
          <p>Todavía no hay transmisiones registradas.</p>
        )}

        {!cargando && !error && transmisiones.length > 0 && (
          <ul>
            {transmisiones.map((transmision) => (
              <li key={transmision.id}>
                <strong>{transmision.nombreEvento}</strong>
                {" — "}
                {transmision.cliente?.nombre || "Sin cliente"}
                {" — "}
                {transmision.estado}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default TransmisionesPage;
