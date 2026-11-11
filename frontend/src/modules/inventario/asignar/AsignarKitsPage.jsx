// M3 · Pantalla: asignar kits a transmisiones (RF 3.5). Solo el Dueño asigna o retira.
import { useCallback, useState } from "react";
import { asignarKit, kitsDeTransmision, retirarKit } from "../../../services/kitService";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { fechaHora, pesos } from "../../../utils/formato";
import SelectorTransmision from "../../../components/SelectorTransmision";
import { NOMBRE_ESTADO } from "../../../utils/transmision";
import CabeceraPagina from "../../../components/ui/CabeceraPagina";
import Card from "../../../components/ui/Card";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { CATEGORIAS_KIT } from "../inventario.utils";

const ESTADOS_QUE_RESERVAN = ["COTIZADA", "ACEPTADA", "CONFIRMADA"];

function KitsDeTransmision({ transmisionId, puedeEditar }) {
  const { sesionExpirada } = useSesion();
  const cargar = useCallback(() => kitsDeTransmision(transmisionId), [transmisionId]);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [trabajando, setTrabajando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [confirmar, setConfirmar] = useState(null); // kit con choques, a la espera de aceptar

  async function ejecutar(accion, clave) {
    setTrabajando(clave);
    setAviso(null);
    try {
      const resultado = await accion();
      setAviso({ tipo: resultado.advertencias?.length ? "advertencia" : "exito",
        texto: `Precio cotizado actualizado: ${pesos(resultado.precioCotizado)}. ${(resultado.advertencias ?? []).join(". ")}` });
      recargar();
    } catch (err) {
      if (err.status === 401) sesionExpirada();
      else setAviso({ tipo: "error", texto: err.message });
    } finally {
      setTrabajando(null);
      setConfirmar(null);
    }
  }

  function pedirAsignar(kit) {
    if (kit.choques.length) setConfirmar(kit);
    else ejecutar(() => asignarKit(transmisionId, kit.id), `a${kit.id}`);
  }

  if (cargando && !datos) return <p role="status">Cargando kits de la transmisión…</p>;
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  const { transmision, asignados, disponibles } = datos;
  const editable = puedeEditar && ESTADOS_QUE_RESERVAN.includes(transmision.estado);

  return (
    <>
      <div className="ui-cifras">
        <div className="ui-cifra"><span>Estado</span><strong>{NOMBRE_ESTADO[transmision.estado]}</strong></div>
        <div className="ui-cifra"><span>Precio base</span><strong>{pesos(transmision.precioBase)}</strong></div>
        <div className="ui-cifra"><span>Precio cotizado</span><strong>{pesos(transmision.precioCotizado)}</strong></div>
        <div className="ui-cifra"><span>Adelanto del 50 %</span><strong>{transmision.requiereAdelanto ? "Requerido" : "No requerido"}</strong></div>
      </div>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      <Card titulo={`Kits asignados (${asignados.length})`}>
        <DataTable
          titulo="Kits asignados a la transmisión"
          datos={asignados}
          vacio="Esta transmisión todavía no tiene kits asignados."
          columnas={[
            { titulo: "Kit", render: (k) => <strong>{k.nombre}</strong> },
            { titulo: "Clasificación", render: (k) => CATEGORIAS_KIT[k.categoria] },
            { titulo: "Recargo aplicado", numero: true, render: (k) => `${k.recargoAplicado} %` },
            ...(editable ? [{ titulo: "Acciones", render: (k) => (
              <Boton variante="peligro" cargando={trabajando === `r${k.id}`} disabled={trabajando !== null}
                onClick={() => ejecutar(() => retirarKit(transmisionId, k.id), `r${k.id}`)}>Retirar</Boton>
            ) }] : []),
          ]}
        />
      </Card>

      {editable && (
        <Card titulo="Kits en condiciones de salir">
          <DataTable
            titulo="Kits que se pueden asignar"
            datos={disponibles}
            vacio="No hay más kits en condiciones de salir. El Jefe de Área Técnica los habilita en la pantalla Kits."
            columnas={[
              { titulo: "Kit", render: (k) => <strong>{k.nombre}</strong> },
              { titulo: "Clasificación", render: (k) => CATEGORIAS_KIT[k.categoria] },
              { titulo: "Horario", render: (k) => k.choques.length
                ? <><Badge tono="advertencia">Comprometido</Badge><small>{k.choques.map((t) => `${t.nombreEvento} (${fechaHora(t.inicio)})`).join(", ")}</small></>
                : <Badge tono="exito">Libre</Badge> },
              { titulo: "Acciones", render: (k) => (
                <Boton cargando={trabajando === `a${k.id}`} disabled={trabajando !== null} onClick={() => pedirAsignar(k)}>Asignar</Boton>
              ) },
            ]}
          />
        </Card>
      )}
      {!editable && puedeEditar && (
        <Alerta tipo="info">Solo se asignan o retiran kits de transmisiones Cotizadas, Aceptadas o Confirmadas.</Alerta>
      )}

      <Modal
        abierto={confirmar !== null}
        titulo="El kit ya está comprometido"
        onCerrar={() => setConfirmar(null)}
        acciones={<>
          <Boton variante="secundario" onClick={() => setConfirmar(null)}>Cancelar</Boton>
          <Boton cargando={trabajando !== null}
            onClick={() => ejecutar(() => asignarKit(transmisionId, confirmar.id, true), `a${confirmar.id}`)}>Asignar igual</Boton>
        </>}
      >
        {confirmar && (
          <p>
            <strong>{confirmar.nombre}</strong> está asignado a {confirmar.choques.map((t) => t.nombreEvento).join(", ")},
            con un horario que coincide o que no deja el tiempo de traslado. ¿Quieres asignarlo de todas formas?
          </p>
        )}
      </Modal>
    </>
  );
}

export default function AsignarKitsPage() {
  const { usuario } = useSesion();
  const puedeEditar = ["DUENO", "ADMIN_DESARROLLO"].includes(usuario.rol);
  const [transmisionId, setTransmisionId] = useState(null);

  return (
    <section className="ui-pagina">
      <CabeceraPagina
        volver={{ href: "#/inventario", texto: "Inventario y kits" }}
        eyebrow="Requisito 3.5"
        titulo="Asignar kits a transmisiones"
        descripcion="Reserva kits para una transmisión. El precio cotizado y el adelanto se recalculan solos."
      />
      <Card>
        <div className="ui-filtros">
          <SelectorTransmision valor={transmisionId} onCambiar={setTransmisionId}
            filtro={(t) => ESTADOS_QUE_RESERVAN.includes(t.estado)}
            ayuda="Se muestran las transmisiones Cotizadas, Aceptadas o Confirmadas." />
        </div>
      </Card>
      {transmisionId
        ? <KitsDeTransmision key={transmisionId} transmisionId={transmisionId} puedeEditar={puedeEditar} />
        : <p className="ui-vacio">Elige una transmisión para ver y asignar sus kits.</p>}
    </section>
  );
}
