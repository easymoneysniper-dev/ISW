// Maneja la sesión de toda la aplicación: comprobarla al abrir, iniciarla y cerrarla.
// main.jsx envuelve la app con este componente. Llama a services/authService.js.
import { useCallback, useEffect, useState } from "react";
import { SesionContext } from "./SesionContext";
import * as authService from "../services/authService";

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(true);

  // Al abrir o recargar la página, pregunta al backend si ya hay una sesión.
  useEffect(() => {
    let activo = true;

    authService
      .obtenerSesion()
      .then((usuarioActual) => {
        if (activo) setUsuario(usuarioActual);
      })
      .catch((error) => {
        // 401 = no hay sesión, es normal. Otro error se muestra en la consola.
        if (error.status !== 401) console.error(error);
      })
      .finally(() => {
        if (activo) setRevisandoSesion(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function iniciarSesion(email, password) {
    const usuarioNuevo = await authService.login(email, password);
    setUsuario(usuarioNuevo);
  }

  async function cerrarSesion() {
    await authService.logout();
    setUsuario(null);
  }

  // Se usa cuando el backend responde 401 (la sesión venció).
  // useCallback mantiene la misma función entre renders (la usa un useEffect).
  const sesionExpirada = useCallback(() => setUsuario(null), []);

  return (
    <SesionContext.Provider
      value={{ usuario, revisandoSesion, iniciarSesion, cerrarSesion, sesionExpirada }}
    >
      {children}
    </SesionContext.Provider>
  );
}
