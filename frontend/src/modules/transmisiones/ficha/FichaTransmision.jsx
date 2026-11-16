// M1 · Ficha de la transmisión (RF 1.8) con sus acciones de estado (RF 1.3, 1.4, 1.6, 1.7 y 1.12).
// La abren la lista y el calendario. onCambio avisa a la pantalla que la abrió para recargar.
import { useCallback, useState } from "react";
import { obtenerTransmision } from "../../../services/transmisionService";
import { useFetch } from "../../../hooks/useFetch";
import { useSesion } from "../../../hooks/useSesion";
import Modal from "../../../components/ui/Modal";
import ListaDatos from "../../../components/ui/ListaDatos";
import DataTable from "../../../components/ui/DataTable";
import Badge from "../../../components/ui/Badge";
import Alerta from "../../../components/ui/Alerta";
import { fechaHora, pesos } from "../../../utils/formato";
import { NOMBRE_ESTADO, TONO_ESTADO, ZONAS } from "../../../utils/transmision";
import { ASISTENCIA, CATEGORIA_KIT, ESTADO_PAGO, puedeGestionar } from "../transmisiones.utils";
import AccionesTransmision from "./AccionesTransmision";

export default function FichaTransmision({ id, onCerrar, onCambio }) {
  const { usuario } = useSesion();
  const cargar = useCallback(() => obtenerTransmision(id), [id]);
  const { datos: t, cargando, error, recargar } = useFetch(cargar);
  const [resultado, setResultado] = useState(null);

  function cambiada(respuesta, texto) {
    setResultado({ texto, advertencias: respuesta.advertencias ?? [] });
    recargar();
    onCambio?.();
  }

  const finanzas = t?.situacionFinanciera;

  return (
    <Modal abierto titulo={t ? t.nombreEvento : "Ficha de la transmisión"} onCerrar={onCerrar} ancho={900}>
      <Alerta tipo="error">{error}</Alerta>
      {cargando && !t && <p role="status">Cargando ficha…</p>}
      {t && (
        <>
          {resultado && (
            <Alerta tipo={resultado.advertencias.length ? "advertencia" : "exito"}>
              {resultado.texto} {resultado.advertencias.join(". ")}
            </Alerta>
          )}

          <h3 className="ui-subtitulo">Datos del evento</h3>
          <ListaDatos datos={[
            { etiqueta: "Estado", valor: <Badge tono={TONO_ESTADO[t.estado]}>{NOMBRE_ESTADO[t.estado]}</Badge> },
            { etiqueta: "Cliente", valor: <>{t.cliente.nombre}<small style={{ display: "block" }}>{[t.cliente.telefono, t.cliente.email].filter(Boolean).join(" · ")}</small></> },
            { etiqueta: "Inicio", valor: fechaHora(t.inicio) },
            { etiqueta: "Término", valor: fechaHora(t.termino) },
            { etiqueta: "Lugar", valor: t.lugar },
            { etiqueta: "Zona", valor: ZONAS[t.zona] },
            { etiqueta: "Cámaras", valor: t.camarasUtilizadas ? `${t.camarasUtilizadas} de ${t.cantidadCamaras} utilizadas` : t.cantidadCamaras },
            { etiqueta: "Tiempo de traslado", valor: `${t.tiempoTrasladoMin} min` },
            ...(t.motivoCancelacion ? [{ etiqueta: "Motivo de cancelación", valor: t.motivoCancelacion }] : []),
          ]} />

          <h3 className="ui-subtitulo">Cotización y situación financiera</h3>
          <ListaDatos datos={[
            { etiqueta: "Precio base", valor: pesos(t.precioBase) },
            { etiqueta: "Ajuste negociado", valor: pesos(t.ajuste) },
            { etiqueta: "Precio cotizado", valor: <strong>{pesos(t.precioCotizado)}</strong> },
            { etiqueta: "Adelanto del 50 %", valor: t.requiereAdelanto ? `Requerido (${pesos(finanzas?.adelantoMinimo)})` : "No requerido" },
            { etiqueta: "Total pagado", valor: pesos(finanzas?.totalPagado) },
            { etiqueta: "Saldo pendiente", valor: pesos(finanzas?.saldoPendiente) },
            { etiqueta: "Estado de pago", valor: ESTADO_PAGO[finanzas?.estadoPago] ?? "Sin pagos" },
            { etiqueta: "Rendición de gastos", valor: finanzas?.rendicionCompleta ? "Completa" : "Pendiente" },
          ]} />

          <h3 className="ui-subtitulo">Personal asignado</h3>
          <DataTable
            titulo="Personal asignado"
            datos={t.asignaciones}
            vacio="Sin personal asignado (se asigna en Personal y asignaciones)."
            columnas={[
              { titulo: "Trabajador", render: (a) => <>{a.trabajador.nombre}<small>{a.trabajador.telefono}</small></> },
              { titulo: "Roles", render: (a) => a.roles.join(", ") || "—" },
              { titulo: "Comisión", numero: true, render: (a) => (a.porcentajeComision === null ? "—" : `${a.porcentajeComision} %`) },
              { titulo: "Asistencia", render: (a) => ASISTENCIA[a.asistencia] ?? a.asistencia },
            ]}
          />

          <h3 className="ui-subtitulo">Kits reservados</h3>
          <DataTable
            titulo="Kits reservados"
            datos={t.kits}
            vacio="Sin kits (se asignan en Inventario y kits)."
            columnas={[
              { titulo: "Kit", campo: "nombre" },
              { titulo: "Categoría", render: (k) => CATEGORIA_KIT[k.categoria] },
              { titulo: "Recargo", numero: true, render: (k) => `${k.recargoAplicado} %` },
            ]}
          />

          {puedeGestionar(usuario.rol) && (
            <AccionesTransmision key={`${t.id}-${t.estado}`} transmision={t} onCambiada={cambiada} />
          )}
        </>
      )}
    </Modal>
  );
}
