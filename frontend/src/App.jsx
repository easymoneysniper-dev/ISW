import { useEffect, useState } from "react";
import Login from "./Login";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(true);
  const [mensaje, setMensaje] = useState("Conectando...");
  const [transmisiones, setTransmisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState("");

  // Comprueba si ya existe una sesión al abrir o recargar la página.
  useEffect(() => {
    let activo = true;

    async function comprobarSesion() {
      try {
        const respuesta = await fetch(`${API_URL}/api/sesion`, {
          credentials: "include",
        });

        if (respuesta.status === 401) return;

        if (!respuesta.ok) {
          throw new Error("No se pudo comprobar la sesión");
        }

        const datos = await respuesta.json();

        if (activo) {
          setUsuario(datos.usuario);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (activo) {
          setRevisandoSesion(false);
        }
      }
    }

    comprobarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // Carga los datos cuando el usuario ha iniciado sesión.
  useEffect(() => {
    if (!usuario) return;

    let activo = true;

    async function comprobarBackend() {
      try {
        const respuesta = await fetch(`${API_URL}/api/health`);

        if (!respuesta.ok) {
          throw new Error("Error al consultar el backend");
        }

        const datos = await respuesta.json();

        if (activo) {
          setMensaje(datos.message);
        }
      } catch {
        if (activo) {
          setMensaje("Error al conectar con el backend");
        }
      }
    }

    async function cargarTransmisiones() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(`${API_URL}/api/transmisiones`, {
          credentials: "include",
        });

        if (respuesta.status === 401) {
          if (activo) {
            setUsuario(null);
            setTransmisiones([]);
          }
          return;
        }

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las transmisiones");
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error("El servidor devolvió una respuesta inesperada");
        }

        if (activo) {
          setTransmisiones(datos);
        }
      } catch (error) {
        if (activo) {
          setError(error.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    comprobarBackend();
    cargarTransmisiones();

    return () => {
      activo = false;
    };
  }, [usuario]);

  async function cerrarSesion() {
  setCerrandoSesion(true);
  setErrorSesion("");

  try {
    const respuesta = await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo cerrar la sesión. Intenta nuevamente.");
    }

    setUsuario(null);
    setTransmisiones([]);
    setError("");
    setMensaje("Conectando...");
  } catch (error) {
    setErrorSesion(error.message);
  } finally {
    setCerrandoSesion(false);
  }
}

  if (revisandoSesion) {
    return <p>Comprobando sesión...</p>;
  }

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  return (
    <main>
      <h1>Sistema de Gestión de Transmisiones</h1>

      <p>Bienvenido, {usuario.nombre}</p>
      <button
        type="button"
        onClick={cerrarSesion}
        disabled={cerrandoSesion}
      >
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

export default App;