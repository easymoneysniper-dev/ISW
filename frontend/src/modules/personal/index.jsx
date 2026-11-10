import { useState } from "react";
import ModuloBase from "../ModuloBase";
import TrabajadoresPage from "../../pages/personal/TrabajadoresPage";
import DisponibilidadPage from "../../pages/personal/DisponibilidadPage";

export default function Modulo(props) {
  const [subVista, setSubVista] = useState("trabajadores");

  if (props.accion?.id === "trabajadores") {
    return (
      <div>
        <div
          style={{
            maxWidth: "960px",
            margin: "1rem auto 0",
            padding: "0 1.5rem",
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid #dbeafe",
          }}
        >
          <button
            type="button"
            onClick={() => setSubVista("trabajadores")}
            style={{
              padding: "0.6rem 1.2rem",
              border: "none",
              borderBottom:
                subVista === "trabajadores" ? "3px solid #1d4ed8" : "3px solid transparent",
              backgroundColor: subVista === "trabajadores" ? "#eff6ff" : "transparent",
              color: "#1e3a8a",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Ficha de Trabajadores (RF-10)
          </button>
          <button
            type="button"
            onClick={() => setSubVista("disponibilidad")}
            style={{
              padding: "0.6rem 1.2rem",
              border: "none",
              borderBottom:
                subVista === "disponibilidad" ? "3px solid #1d4ed8" : "3px solid transparent",
              backgroundColor: subVista === "disponibilidad" ? "#eff6ff" : "transparent",
              color: "#1e3a8a",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Disponibilidad Horaria (RF-11)
          </button>
        </div>

        {subVista === "trabajadores" ? <TrabajadoresPage /> : <DisponibilidadPage />}
      </div>
    );
  }

  return <ModuloBase {...props} />;
}