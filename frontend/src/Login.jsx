import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function iniciarSesion(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    const API_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";

    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.message || "No se pudo iniciar sesión");
      }

      setPassword("");
      onLogin(datos.usuario);
    } catch (error) {
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  }

    return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <span className="login-brand-icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="6" width="12" height="12" rx="3" />
              <path d="m15 10 6-3v10l-6-3" />
            </svg>
          </span>

          <span>Gestión de Transmisiones</span>
        </div>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-heading">
            <span className="login-eyebrow">ACCESO AL SISTEMA</span>
            <h1 id="login-title">Bienvenido</h1>
            <p>Ingresa tus credenciales para continuar.</p>
          </div>

          <form className="login-form" onSubmit={iniciarSesion}>
            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@correo.cl"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                disabled={enviando}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                disabled={enviando}
                required
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={enviando}
            >
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="login-help">
            Si necesitas acceso, contacta al administrador.
          </p>
        </section>

        <p className="login-footer">
          Sistema de Gestión de Transmisiones
        </p>
      </div>
    </main>
  );
}

export default Login;