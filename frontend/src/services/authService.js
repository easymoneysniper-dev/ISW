// Llamadas a la API relacionadas con la sesión. Lo usa SesionProvider.jsx.
import { pedir } from "./api";

// Devuelve el usuario si el correo y la contraseña son correctos.
export async function login(email, password) {
  const datos = await pedir("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return datos.usuario;
}

// Devuelve el usuario de la sesión actual (lanza ApiError 401 si no hay sesión).
export async function obtenerSesion() {
  const datos = await pedir("/sesion");
  return datos.usuario;
}

export function logout() {
  return pedir("/logout", { method: "POST" });
}
