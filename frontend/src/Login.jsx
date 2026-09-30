import { useState } from "react";

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
    <section>
      <h1>Sistema de Gestión de Transmisiones</h1>
      <h2>Iniciar sesión</h2>

      <form onSubmit={iniciarSesion}>
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            disabled={enviando}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            disabled={enviando}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </section>
  );
}

export default Login;