// M3 · Equipos y reporte mensual (RF 3.1 y 3.6). Lo usa equipo.controller.js.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { fechaChile } = require("../utils/horario");
const { noEncontrado, conflicto, datosInvalidos } = require("../utils/errores");

const incluirKit = { kit: { select: { id: true, nombre: true } } };

// Las columnas de fecha no tienen hora: se usa el día de Chile.
const hoy = () => new Date(`${fechaChile(new Date())}T00:00:00.000Z`);

function listar() {
  return prisma.equipo.findMany({ include: incluirKit, orderBy: [{ nombre: "asc" }, { id: "asc" }] });
}

function listarKits() {
  return prisma.kit.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
}

function traducirErrorPrisma(error) {
  if (error.code === "P2002") {
    const esSerie = String(error.meta?.target).includes("numeroSerie");
    return conflicto(esSerie
      ? "Ya existe un equipo con ese número de serie. Revisa el inventario."
      : "Ya existe un kit con ese nombre. Selecciónalo en la lista de kits existentes.");
  }
  if (error.code === "P2003") return datosInvalidos("El kit seleccionado no existe. Actualiza la lista.");
  if (error.code === "P2025") return noEncontrado("Equipo no encontrado");
  return error;
}

// Ficha, kit nuevo y auditoría van en una transacción: se guardan todos o ninguno.
// La fecha de baja se guarda al pasar a «Dado de baja», para el reporte mensual.
async function guardar(datos, usuarioId, id = null) {
  const { nuevoKitNombre, fechaCompra, ...campos } = datos;

  try {
    return await prisma.$transaction(async (tx) => {
      const anterior = id === null
        ? null
        : await tx.equipo.findUnique({ where: { id }, select: { estado: true, fechaBaja: true, kitId: true } });
      if (id !== null && !anterior) throw noEncontrado("Equipo no encontrado");

      // Un equipo que ya estaba en el kit puede quedarse aunque no esté disponible.
      const entraAUnKit = nuevoKitNombre || (campos.kitId && campos.kitId !== anterior?.kitId);
      if (entraAUnKit && campos.estado !== "DISPONIBLE") {
        throw datosInvalidos("Solo un equipo disponible puede incorporarse a un kit (Requisito 3.2)");
      }

      if (nuevoKitNombre) {
        const kit = await tx.kit.create({ data: { nombre: nuevoKitNombre } });
        campos.kitId = kit.id;
      }

      const sigueDeBaja = anterior?.estado === "DADO_DE_BAJA" && campos.estado === "DADO_DE_BAJA";
      const data = {
        ...campos,
        fechaCompra: new Date(`${fechaCompra}T00:00:00.000Z`),
        fechaBaja: campos.estado === "DADO_DE_BAJA" ? (sigueDeBaja ? anterior.fechaBaja : hoy()) : null,
      };

      const equipo = id === null
        ? await tx.equipo.create({ data, include: incluirKit })
        : await tx.equipo.update({ where: { id }, data, include: incluirKit });

      await auditoria.registrar(tx, {
        usuarioId,
        modulo: "M3",
        accion: id === null ? "CREAR" : "EDITAR",
        entidad: "Equipo",
        entidadId: equipo.id,
        detalle: `${id === null ? "Registro" : "Actualización"} de ${equipo.nombre}. Estado: ${equipo.estado}. Kit: ${equipo.kit?.nombre ?? "repuesto suelto"}`,
      });
      return equipo;
    });
  } catch (error) {
    throw traducirErrorPrisma(error);
  }
}

// [desde, hasta) del mes, para columnas de fecha sin hora.
function rangoMes(mes) {
  const desde = new Date(`${mes}-01T00:00:00.000Z`);
  const hasta = new Date(desde);
  hasta.setUTCMonth(hasta.getUTCMonth() + 1);
  return { desde, hasta };
}

const sumarPrecios = (equipos) => equipos.reduce((suma, equipo) => suma + Number(equipo.precioCompra), 0);

async function comprasMensuales(mes) {
  const { desde, hasta } = rangoMes(mes);
  // Se usa la fecha de compra, no la de registro. Los equipos dados de baja
  // siguen formando parte de las compras de su mes y no se duplican al editar.
  const equipos = await prisma.equipo.findMany({
    where: { fechaCompra: { gte: desde, lt: hasta } },
    include: incluirKit,
    orderBy: [{ fechaCompra: "asc" }, { id: "asc" }],
  });
  return { mes, cantidad: equipos.length, total: String(sumarPrecios(equipos)), equipos };
}

// Los daños se listan como incidentes, pero no suman como pérdida.
async function reporteMensual(mes) {
  const { desde, hasta } = rangoMes(mes);
  const enElMes = { gte: desde, lt: hasta };

  const [compras, bajas, incidentes] = await Promise.all([
    prisma.equipo.findMany({ where: { fechaCompra: enElMes }, include: incluirKit, orderBy: [{ fechaCompra: "asc" }, { id: "asc" }] }),
    prisma.equipo.findMany({ where: { fechaBaja: enElMes }, include: incluirKit, orderBy: [{ fechaBaja: "asc" }, { id: "asc" }] }),
    prisma.incidente.findMany({
      where: { fecha: enElMes },
      include: {
        salida: {
          select: {
            equipo: { select: { id: true, nombre: true, numeroSerie: true, precioCompra: true } },
            transmision: { select: { id: true, nombreEvento: true } },
            responsable: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: [{ fecha: "asc" }, { id: "asc" }],
    }),
  ]);

  const lista = incidentes.map(({ salida, ...incidente }) => ({ ...incidente, ...salida }));
  const perdidas = lista.filter((incidente) => incidente.tipo !== "DANO");
  const totalCompras = sumarPrecios(compras);
  const totalPerdidas = sumarPrecios(perdidas.map((incidente) => incidente.equipo));

  return {
    mes,
    compras: { cantidad: compras.length, total: totalCompras, equipos: compras },
    perdidas: { cantidad: perdidas.length, total: totalPerdidas, incidentes: perdidas },
    bajas: { cantidad: bajas.length, total: sumarPrecios(bajas), equipos: bajas },
    incidentes: lista,
  };
}

module.exports = { listar, listarKits, guardar, comprasMensuales, reporteMensual, traducirErrorPrisma };
