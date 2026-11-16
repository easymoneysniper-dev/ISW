// M1 · Clientes (RF 1.9–1.11): buscar, registrar, modificar y eliminar (solo sin transmisiones).
import { useCallback, useState } from "react";
import { crearCliente, editarCliente, eliminarCliente, listarClientes } from "../../../services/clienteService";
import { useFetch } from "../../../hooks/useFetch";
import { useAccion } from "../../../hooks/useAccion";
import Card from "../../../components/ui/Card";
import Campo from "../../../components/ui/Campo";
import Boton from "../../../components/ui/Boton";
import Alerta from "../../../components/ui/Alerta";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";

export default function ClientesPanel() {
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState("");
  const cargar = useCallback(() => listarClientes(filtro), [filtro]);
  const { datos, cargando, error, recargar } = useFetch(cargar);
  const [ficha, setFicha] = useState(null); // null = cerrada, {} = nuevo, cliente = editar
  const [porEliminar, setPorEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const eliminar = useAccion();

  function guardado(cliente, esNuevo) {
    setMensaje(`Cliente ${cliente.nombre} ${esNuevo ? "registrado" : "modificado"}.`);
    setFicha(null);
    recargar();
  }

  async function confirmarEliminar() {
    const respuesta = await eliminar.ejecutar(() => eliminarCliente(porEliminar.id));
    if (respuesta) {
      setMensaje(respuesta.message);
      setPorEliminar(null);
      recargar();
    }
  }

  return (
    <Card
      titulo="Clientes"
      acciones={<Boton onClick={() => { setFicha({}); setMensaje(""); }}>Registrar cliente</Boton>}
    >
      <form className="ui-filtros" onSubmit={(e) => { e.preventDefault(); setFiltro(buscar.trim()); }}>
        <Campo etiqueta="Buscar por nombre, teléfono o correo">
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </Campo>
        <Boton type="submit" variante="secundario">Buscar</Boton>
      </form>

      <Alerta tipo="exito">{mensaje}</Alerta>
      <Alerta tipo="error">{error}</Alerta>
      {cargando ? <p role="status">Cargando clientes…</p> : (
        <DataTable
          titulo="Clientes registrados"
          datos={datos ?? []}
          vacio={filtro ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes registrados."}
          columnas={[
            { titulo: "Nombre", campo: "nombre" },
            { titulo: "Teléfono", render: (c) => c.telefono || "—" },
            { titulo: "Correo", render: (c) => c.email || "—" },
            { titulo: "Transmisiones", numero: true, render: (c) => c._count?.transmisiones ?? 0 },
            { titulo: "Acciones", render: (c) => (
              <div className="ui-botones" style={{ margin: 0 }}>
                <Boton variante="secundario" onClick={() => { setFicha(c); setMensaje(""); }} aria-label={`Modificar ${c.nombre}`}>Modificar</Boton>
                <Boton variante="peligro" disabled={c._count?.transmisiones > 0}
                  title={c._count?.transmisiones > 0 ? "Tiene transmisiones asociadas" : undefined}
                  onClick={() => { setPorEliminar(c); setMensaje(""); }} aria-label={`Eliminar ${c.nombre}`}>Eliminar</Boton>
              </div>
            ) },
          ]}
        />
      )}

      {ficha && <ClienteForm cliente={ficha.id ? ficha : null} onGuardado={guardado} onCerrar={() => setFicha(null)} />}

      <Modal
        abierto={Boolean(porEliminar)}
        titulo="Eliminar cliente"
        onCerrar={() => setPorEliminar(null)}
        acciones={<>
          <Boton variante="secundario" onClick={() => setPorEliminar(null)} disabled={eliminar.guardando}>Volver</Boton>
          <Boton variante="peligro" cargando={eliminar.guardando} onClick={confirmarEliminar}>Eliminar</Boton>
        </>}
      >
        <p>¿Eliminar a <strong>{porEliminar?.nombre}</strong>? Esta acción no se puede deshacer.</p>
        <Alerta tipo="error">{eliminar.error}</Alerta>
      </Modal>
    </Card>
  );
}

function ClienteForm({ cliente, onGuardado, onCerrar }) {
  const { ejecutar, guardando, error } = useAccion();
  const [datos, setDatos] = useState({
    nombre: cliente?.nombre ?? "", telefono: cliente?.telefono ?? "", email: cliente?.email ?? "",
  });
  const cambio = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const cuerpo = { nombre: datos.nombre, telefono: datos.telefono || null, email: datos.email || null };
    const respuesta = await ejecutar(() => (cliente ? editarCliente(cliente.id, cuerpo) : crearCliente(cuerpo)));
    if (respuesta) onGuardado(respuesta, !cliente);
  }

  return (
    <Modal abierto titulo={cliente ? `Modificar ${cliente.nombre}` : "Registrar cliente"} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <fieldset disabled={guardando} className="ui-fieldset">
          <div className="ui-formulario">
            <Campo etiqueta="Nombre *" anchoCompleto>
              <input required maxLength={150} value={datos.nombre} onChange={cambio("nombre")} />
            </Campo>
            <Campo etiqueta="Teléfono" ayuda="Teléfono o correo: al menos uno.">
              <input type="tel" maxLength={30} value={datos.telefono} onChange={cambio("telefono")} />
            </Campo>
            <Campo etiqueta="Correo">
              <input type="email" maxLength={254} value={datos.email} onChange={cambio("email")} />
            </Campo>
          </div>
        </fieldset>
        <Alerta tipo="error">{error}</Alerta>
        <div className="ui-botones">
          <Boton type="submit" cargando={guardando}>{cliente ? "Guardar cambios" : "Registrar cliente"}</Boton>
          <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>Cancelar</Boton>
        </div>
      </form>
    </Modal>
  );
}
