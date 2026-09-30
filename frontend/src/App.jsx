// Decide qué pantalla mostrar según la sesión: cargando, login o pantalla principal.
import { useSesion } from "./hooks/useSesion";
import LoginPage from "./pages/LoginPage";
import TransmisionesPage from "./pages/TransmisionesPage";

function App() {
  const { usuario, revisandoSesion } = useSesion();

  if (revisandoSesion) {
    return <p>Comprobando sesión...</p>;
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return <TransmisionesPage />;
}

export default App;
