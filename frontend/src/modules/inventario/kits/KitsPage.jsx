// M3 · Pantalla: kits (RF 3.2). Gestiona el Jefe de Área Técnica; el Dueño consulta.
import { useState } from "react";
import { listarKits } from "../../../services/kitService";
import { listarEquipos } from "../../../services/equipoService";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import KitForm from "./KitForm";
import { CATEGORIAS_KIT, TIPOS_EQUIPO } from "../inventario.utils";

const cargar = () => Promise.all([listarKits(), listarEquipos()]);

export default function KitsPage() {
  const { usuario } = useSesion();
  const puedeEditar = ["JEFE_TECNICO", "ADMIN_DESARROLLO"].includes(usuario.rol);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [ficha, setFicha] = useState(null); // null = cerrada, {} = nuevo, kit = editar
  const [mensaje, setMensaje] = useState(null);
  const [kits, equipos] = datos ?? [[], []];

  function guardado(kit) {
    setMensaje({ texto: `Kit ${kit.nombre} guardado.`, advertencias: kit.advertencias ?? [] });
    setFicha(null);
    recargar();
  }

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/inventario", texto: "Inventario y kits" }}
        eyebrow="Requisito 3.2"
        titulo="Kits"
        descripcion="Arma los kits con equipos disponibles, clasifícalos y decide si están en condiciones de salir."
        extra={<Badge tono="info">{puedeEditar ? "Gestión de kits" : "Solo consulta"}</Badge>}
      />

      {mensaje && (
        <Alerta tipo={mensaje.advertencias.length ? "advertencia" : "exito"}>
          {mensaje.texto} {mensaje.advertencias.join(". ")}
        </Alerta>
      )}

      {puedeEditar && ficha !== null && (
        <KitForm key={ficha.id ?? "nuevo"} kit={ficha.id ? ficha : null} equipos={equipos}
          onGuardado={guardado} onCancelar={() => setFicha(null)} />
      )}

      <Card
        titulo="Kits registrados"
        acciones={<>
          <Boton variante="secundario" onClick={recargar} disabled={cargando}>Actualizar</Boton>
          {puedeEditar && <Boton onClick={() => { setFicha({}); setMensaje(null); }} disabled={ficha !== null || cargando}>Crear kit</Boton>}
        </>}
      >
        <Alerta tipo="error">{error}</Alerta>
        {cargando ? <p role="status">Cargando kits…</p> : (
          <DataTable
            titulo="Kits de la empresa"
            datos={kits}
            vacio="Todavía no hay kits. Crea el primero con los equipos disponibles."
            columnas={[
              { titulo: "Kit", render: (k) => <><strong>{k.nombre}</strong><small>{CATEGORIAS_KIT[k.categoria]}</small></> },
              { titulo: "Equipos", render: (k) => (
                <>{k.equipos.length} equipo(s)<small>{k.equipos.map((e) => `${e.nombre} (${TIPOS_EQUIPO[e.tipo]})`).join(", ")}</small></>
              ) },
              { titulo: "Composición", render: (k) => k.faltantes.length
                ? <Badge tono="advertencia">Falta: {k.faltantes.join(", ")}</Badge>
                : <Badge tono="exito">Completa</Badge> },
              { titulo: "Salida a terreno", render: (k) => k.enCondiciones
                ? <Badge tono="exito">En condiciones</Badge>
                : <Badge>No está en condiciones</Badge> },
              ...(puedeEditar ? [{ titulo: "Acciones", render: (k) => (
                <Boton variante="secundario" onClick={() => { setFicha(k); setMensaje(null); }} disabled={ficha !== null}
                  aria-label={`Modificar ${k.nombre}`}>Modificar</Boton>
              ) }] : []),
            ]}
          />
        )}
      </Card>
    </section>
  );
}
