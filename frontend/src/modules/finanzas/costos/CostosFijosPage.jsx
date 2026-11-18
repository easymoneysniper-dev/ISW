// Costos fijos del mes. Se muestran en la pantalla de gastos, debajo de los gastos.
// El Contador elige mes y año, agrega costos fijos y elimina los que ingresó por error.
// El Dueño ve la lista y el total, sin el formulario ni los botones.
import { useCallback, useState } from "react";
import { useSesion } from "../../../hooks/useSesion";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import { listarCostosFijos, eliminarCostoFijo } from "../../../services/costoFijoService";
import Card from "../../../components/ui/Card";
import Alerta from "../../../components/ui/Alerta";
import Boton from "../../../components/ui/Boton";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import SelectorMes from "../SelectorMes";
import RegistrarCostoFijoForm from "./RegistrarCostoFijoForm";
import { formatearPesos, periodoActual } from "../formato";

// Solo el Contador registra y elimina costos fijos (el backend también lo exige).
const ROLES_QUE_REGISTRAN = ["CONTADOR"];

export default function CostosFijosPage() {
  const { usuario } = useSesion();
  const puedeRegistrar = ROLES_QUE_REGISTRAN.includes(usuario?.rol);
  const [periodo, setPeriodo] = useState(periodoActual);

  return (
    <Card titulo="Costos fijos del mes">
      <SelectorMes anio={periodo.anio} mes={periodo.mes} onCambiar={setPeriodo} />
      <CostosDelMes key={`${periodo.anio}-${periodo.mes}`} periodo={periodo} puedeRegistrar={puedeRegistrar} />
    </Card>
  );
}

// Costos del mes elegido. Se vuelve a crear cada vez que cambia el mes o el año.
function CostosDelMes({ periodo, puedeRegistrar }) {
  const cargar = useCallback(() => listarCostosFijos(periodo.anio, periodo.mes), [periodo]);
  const { datos: resultado, cargando, error, recargar } = useFetch(cargar);
  const eliminacion = useAccion();
  const [porEliminar, setPorEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");

  function listo(texto) {
    setMensaje(texto);
    recargar();
  }

  async function eliminar() {
    const costo = porEliminar;
    const respuesta = await eliminacion.ejecutar(() => eliminarCostoFijo(costo.id));
    setPorEliminar(null);
    if (respuesta) listo(`Costo fijo "${costo.nombre}" eliminado.`);
  }

  return (
    <>
      <Alerta tipo="error">{error || eliminacion.error}</Alerta>
      <Alerta tipo="exito">{mensaje}</Alerta>
      {cargando && !resultado && <p role="status">Cargando costos fijos…</p>}

      {resultado && (
        <>
          <div className="ui-cifras">
            <div className="ui-cifra">
              <span>Total del mes</span>
              <strong>{formatearPesos(resultado.total)}</strong>
            </div>
          </div>

          <h3 className="ui-subtitulo">Costos registrados</h3>
          <DataTable
            titulo="Costos fijos del mes"
            datos={resultado.costos}
            vacio="Todavía no hay costos fijos en este mes."
            columnas={[
              { titulo: "Nombre", campo: "nombre" },
              { titulo: "Monto", numero: true, render: (costo) => formatearPesos(costo.monto) },
              ...(puedeRegistrar
                ? [
                    {
                      titulo: "Acciones",
                      render: (costo) => (
                        <Boton variante="peligro" onClick={() => setPorEliminar(costo)} aria-label={`Eliminar ${costo.nombre}`}>
                          Eliminar
                        </Boton>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </>
      )}

      {puedeRegistrar && (
        <RegistrarCostoFijoForm
          anio={periodo.anio}
          mes={periodo.mes}
          onCostoRegistrado={() => listo("Costo fijo agregado.")}
        />
      )}

      <Modal
        abierto={porEliminar !== null}
        titulo="Eliminar costo fijo"
        onCerrar={() => setPorEliminar(null)}
        acciones={
          <>
            <Boton variante="secundario" onClick={() => setPorEliminar(null)} disabled={eliminacion.guardando}>
              Cancelar
            </Boton>
            <Boton variante="peligro" onClick={eliminar} cargando={eliminacion.guardando}>
              Eliminar
            </Boton>
          </>
        }
      >
        <p>¿Eliminar &quot;{porEliminar?.nombre}&quot;?</p>
      </Modal>
    </>
  );
}