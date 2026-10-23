const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");

const incluirKit = { kit: { select: { id: true, nombre: true } } };

function listar() {
  return prisma.equipo.findMany({ include: incluirKit, orderBy: [{ nombre: "asc" }, { id: "asc" }] });
}

function listarKits() {
  return prisma.kit.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
}

// Ficha, kit nuevo (si se indicó) y auditoría se guardan juntos o ninguno.
function guardar(datos, usuarioId, id = null) {
  return prisma.$transaction(async (tx) => {
    const { nuevoKitNombre, fechaCompra, ...campos } = datos;
    if (nuevoKitNombre) {
      const kit = await tx.kit.create({ data: { nombre: nuevoKitNombre } });
      campos.kitId = kit.id;
    }
    const data = { ...campos, fechaCompra: new Date(`${fechaCompra}T00:00:00.000Z`) };
    const equipo = id === null
      ? await tx.equipo.create({ data, include: incluirKit })
      : await tx.equipo.update({ where: { id }, data, include: incluirKit });

    await tx.registroCambio.create({ data: {
      usuarioId,
      modulo: "M3",
      accion: id === null ? "CREAR" : "EDITAR",
      entidad: "Equipo",
      entidadId: equipo.id,
      detalle: `${id === null ? "Registro" : "Actualización"} de ${equipo.nombre}. Estado: ${equipo.estado}. Kit: ${equipo.kitId ?? "repuesto suelto"}`,
    } });
    return equipo;
  });
}

async function comprasMensuales(mes) {
  const desde = new Date(`${mes}-01T00:00:00.000Z`);
  const hasta = new Date(desde);
  hasta.setUTCMonth(hasta.getUTCMonth() + 1);
  // Se usa la fecha de compra, no la de registro. Los equipos dados de baja
  // siguen formando parte de las compras de su mes y no se duplican al editar.
  const equipos = await prisma.equipo.findMany({
    where: { fechaCompra: { gte: desde, lt: hasta } },
    include: incluirKit,
    orderBy: [{ fechaCompra: "asc" }, { id: "asc" }],
  });
  const total = equipos.reduce((suma, equipo) => suma.plus(equipo.precioCompra), new Prisma.Decimal(0));
  return { mes, cantidad: equipos.length, total: total.toFixed(0), equipos };
}

module.exports = { listar, listarKits, guardar, comprasMensuales };
