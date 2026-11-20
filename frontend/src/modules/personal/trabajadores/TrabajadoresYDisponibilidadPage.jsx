// M2 · Trabajadores y disponibilidad horaria (RF 2.1 y 2.2). Lo usa modules/personal/index.jsx.
import { useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Badge from "../../../components/ui/Badge";
import Pestanas from "../../../components/ui/Pestanas";
import { puedeGestionar } from "../personal.utils";
import TrabajadoresPanel from "./TrabajadoresPanel";
import DisponibilidadPanel from "./DisponibilidadPanel";

export default function TrabajadoresYDisponibilidadPage() {
  const { usuario } = useSesion();
  const puedeEditar = puedeGestionar(usuario?.rol);
  const [pestana, setPestana] = useState("trabajadores");

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/personal", texto: "Personal y asignaciones" }}
        eyebrow="Requisitos 2.1 y 2.2"
        titulo="Trabajadores y disponibilidad"
        descripcion="Registra personal técnico con sus roles habilitados y mantén al día sus bloques horarios."
        extra={<Badge tono="info">{puedeEditar ? "Gestión" : "Solo consulta"}</Badge>}
      />

      <Pestanas
        activa={pestana}
        onCambiar={setPestana}
        pestanas={[
          {
            clave: "trabajadores",
            titulo: "Ficha de trabajadores",
            contenido: <TrabajadoresPanel puedeEditar={puedeEditar} />,
          },
          {
            clave: "disponibilidad",
            titulo: "Disponibilidad horaria",
            contenido: <DisponibilidadPanel puedeEditar={puedeEditar} />,
          },
        ]}
      />
    </section>
  );
}