// Contexto de la sesión: guarda el usuario conectado para que todas las pantallas lo lean.
// Lo llena SesionProvider.jsx y se lee con el hook useSesion().
import { createContext } from "react";

export const SesionContext = createContext(null);
