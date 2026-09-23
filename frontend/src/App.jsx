
import { useEffect, useState } from "react";

function App() {
  const [mensaje, setMensaje] = useState("Conectando...");

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setMensaje(data.message);
      })
      .catch((error) => {
        console.error(error);
        setMensaje("Error al conectar con el backend");
      });
  }, []);

  return (
    <div>
      <h1>Sistema de Gestion de Transmisiones</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;