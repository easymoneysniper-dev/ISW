// Decide qué pantalla mostrar según la sesión: cargando, login o pantalla principal.
import { useSesion } from "./hooks/useSesion";
import LoginPage from "./pages/LoginPage";
import MenuPrincipal from "./pages/MenuPrincipal";

function App() {
  const { usuario, revisandoSesion } = useSesion();

  if (revisandoSesion) {
    return <p>Comprobando sesión...</p>;
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return <MenuPrincipal />;
}

export default App;
