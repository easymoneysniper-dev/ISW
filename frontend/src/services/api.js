// ÚNICO archivo que conoce la dirección del backend (Clase 6).
// Los demás services usan pedir() para hablar con la API.
//   Local:    VITE_API_URL=http://localhost:3000/api
//   Servidor: VITE_API_URL=/api
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Error con el código HTTP, para que las pantallas sepan si fue 401, 400, etc.
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// Hace la petición, envía la cookie de sesión y devuelve el JSON de la respuesta.
// Si el backend responde con error, lanza ApiError con el mensaje del backend.
export async function pedir(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      credentials: "include",
      ...opciones,
      headers: {
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...opciones.headers,
      },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Errores de Zod: muestra el mensaje de cada campo. Si no, el mensaje general.
    const mensaje =
      datos?.detalles?.map((detalle) => detalle.mensaje).join(". ") ||
      datos?.message ||
      "Ocurrió un error inesperado";

    throw new ApiError(mensaje, respuesta.status);
  }

  return datos;
}
