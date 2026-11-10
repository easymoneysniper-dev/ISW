// Reglas y consultas de transmisiones: registro, consulta, calendario y requerimientos
// (Requisitos 1.1, 1.2, 1.8 y 1.12). Los cambios de estado están en transmisionEstado.service.js.
// Lo usa controllers/transmision.controller.js. Habla con la BD a través de config/prisma.js.
// Si una regla no se cumple, devuelve { error, status } en vez de lanzar un error.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { calcularCotizacion, recalcular } = require("./cotizacion.service");
const { sincronizarEstados } = require("./transmisionEstado.service");
const pagoService = require("./pago.service");
const { fechaChile } = require("../utils/horario");
const { formatearTransmision: formatear } = require("../utils/formato");

const ESTADOS_MODIFICABLES = ["ACEPTADA", "CONFIRMADA"];

const errorPrecio = (precio) => ({
  error: `El ajuste deja el precio cotizado en $${precio}; debe ser mayor que cero`,
  status: 400,
});

// GET /api/transmisiones: todas (o las de un estado), de la más próxima a la más lejana.
async function listar({ estado } = {}) {
  await sincronizarEstados();
  const transmisiones = await prisma.transmision.findMany({
    where: estado ? { estado } : {},
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: { inicio: "asc" },
  });
  return transmisiones.map(formatear);
}

// Requisito 1.8: ficha con fecha, lugar, cliente, estado, personal con roles, kits y situación financiera.
async function obtener(id) {
  await sincronizarEstados();
  const transmision = await prisma.transmision.findUnique({
    where: { id },
    include: {
      cliente: true,
      asignaciones: {
        include: {
          trabajador: { select: { id: true, nombre: true, telefono: true } },
          roles: { select: { rolTecnico: { select: { nombre: true } } } },
        },
        orderBy: { id: "asc" },
      },
      kits: { include: { kit: { select: { id: true, nombre: true, categoria: true } } } },
    },
  });
  if (!transmision) return null;

  const pagos = await pagoService.resumenPorTransmision(id);

  return {
    ...formatear(transmision),
    asignaciones: transmision.asignaciones.map(({ roles, ...asignacion }) => ({
      ...asignacion,
      porcentajeComision: asignacion.porcentajeComision === null ? null : Number(asignacion.porcentajeComision),
      roles: roles.map((r) => r.rolTecnico.nombre),
    })),
    kits: transmision.kits.map((uso) => ({ ...uso.kit, recargoAplicado: Number(uso.recargoAplicado) })),
    situacionFinanciera: {
      totalPagado: pagos.totalPagado,
      saldoPendiente: pagos.saldoPendiente,
      adelantoMinimo: pagos.adelantoMinimo,
      estadoPago: pagos.estadoPago,
      rendicionCompleta: Boolean(transmision.fechaRendicion),
    },
  };
}

// Requisito 1.8: transmisiones de un mes (AAAA-MM), con su fecha local de Chile.
async function calendario(mes) {
  await sincronizarEstados();
  const [anio, numeroMes] = mes.split("-").map(Number);
  // Se busca con un día de holgura por la diferencia horaria y luego se filtra por fecha chilena.
  const desde = new Date(Date.UTC(anio, numeroMes - 1, 0));
  const hasta = new Date(Date.UTC(anio, numeroMes, 2));

  const transmisiones = await prisma.transmision.findMany({
    where: { inicio: { gte: desde, lt: hasta } },
    select: {
      id: true,
      nombreEvento: true,
      inicio: true,
      termino: true,
      lugar: true,
      estado: true,
      cliente: { select: { id: true, nombre: true } },
    },
    orderBy: { inicio: "asc" },
  });

  return {
    mes,
    transmisiones: transmisiones
      .map((transmision) => ({ ...transmision, fecha: fechaChile(transmision.inicio) }))
      .filter((transmision) => transmision.fecha.startsWith(mes)),
  };
}

// Requisitos 1.1 y 1.2: registra la transmisión en estado Cotizada con su cotización calculada.
async function crear(datos, usuarioId) {
  const { cliente: nuevoCliente, clienteId, ...campos } = datos;
  const cotizacion = calcularCotizacion(campos); // al registrar aún no tiene kits (Requisito 3.5)
  if (cotizacion.precioCotizado <= 0) return errorPrecio(cotizacion.precioCotizado);

  if (clienteId) {
    const existe = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!existe) return { error: "El cliente indicado no existe", status: 404 };
  }

  return prisma.$transaction(async (tx) => {
    let idCliente = clienteId;
    if (nuevoCliente) {
      const cliente = await tx.cliente.create({ data: nuevoCliente });
      idCliente = cliente.id;
      await auditoria.registrar(tx, {
        usuarioId, modulo: "M1", accion: "CREAR", entidad: "Cliente", entidadId: cliente.id,
        detalle: `Registró al cliente ${cliente.nombre} al registrar una transmisión`,
      });
    }

    const transmision = await tx.transmision.create({
      data: { ...campos, ...cotizacion, clienteId: idCliente },
      include: { cliente: { select: { id: true, nombre: true } } },
    });
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M1", accion: "CREAR", entidad: "Transmision", entidadId: transmision.id,
      detalle: `Registró la transmisión ${transmision.nombreEvento} (cotizada en $${cotizacion.precioCotizado})`,
    });

    return { transmision: formatear(transmision), advertencias: [] };
  });
}

// Requisito 1.12: cambia cámaras, traslado, precio base o ajuste y recalcula la cotización.
async function modificarRequerimientos(id, cambios, usuarioId) {
  const actual = await prisma.transmision.findUnique({
    where: { id },
    include: { kits: { select: { recargoAplicado: true } } },
  });
  if (!actual) return { error: "Transmisión no encontrada", status: 404 };
  if (!ESTADOS_MODIFICABLES.includes(actual.estado)) {
    return {
      error: `Solo se modifican transmisiones Aceptadas o Confirmadas (estado actual: ${actual.estado})`,
      status: 409,
    };
  }

  const nueva = calcularCotizacion({ ...actual, ...cambios, recargos: actual.kits.map((k) => k.recargoAplicado) });
  if (nueva.precioCotizado <= 0) return errorPrecio(nueva.precioCotizado);

  const advertencias = [];
  if (actual.estado === "CONFIRMADA" && nueva.requiereAdelanto && !(await pagoService.adelantoRecibido(id))) {
    advertencias.push("La transmisión está Confirmada y ahora requiere un adelanto del 50 % que aún no se ha recibido");
  }

  return prisma.$transaction(async (tx) => {
    await tx.transmision.update({ where: { id }, data: cambios });
    const transmision = await recalcular(tx, id);
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M1", accion: "EDITAR", entidad: "Transmision", entidadId: id,
      detalle: `Modificó requerimientos (${Object.keys(cambios).join(", ")}); nuevo precio cotizado $${transmision.precioCotizado}`,
    });
    return { transmision: formatear(transmision), advertencias };
  });
}

module.exports = { listar, obtener, calendario, crear, modificarRequerimientos };
