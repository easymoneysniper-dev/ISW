// UI · Tabla. columnas: [{ titulo, campo?, render?, numero? }].
import { Table } from "antd";

export default function DataTable({ columnas, datos, vacio = "No hay datos para mostrar.", titulo, claveFila = (fila) => fila.id }) {
  return (
    <Table
      aria-label={titulo}
      dataSource={datos}
      rowKey={claveFila}
      pagination={datos.length > 10 ? { pageSize: 10, hideOnSinglePage: true } : false}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: vacio }}
      columns={columnas.map((col) => ({
        key: col.titulo,
        title: col.titulo,
        align: col.numero ? "right" : undefined,
        render: (_, fila) => (col.render ? col.render(fila) : fila[col.campo]),
      }))}
    />
  );
}
