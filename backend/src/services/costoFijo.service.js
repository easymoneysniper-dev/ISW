// Reglas y consultas de los costos fijos del mes (M4, requisito 4.3).
// Lo usan costoFijo.controller.js y reporte.service.js (resumen mensual, requisito 4.7).
// Si una regla no se cumple, lanza un error de negocio y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const { noEncontrado, conflicto } = require("../utils/errores");

// TEMPORAL: cambiar por auditoriaService.registrar(...) cuando exista (RF-48).
function registrarCambio(usuarioId, accion, entidadId, detalle) {
  return prisma.registroCambio.create({
    data: { usuarioId, modulo: "M4", accion, entidad: "CostoFijo", entidadId, detalle },
  });
}

// Costos fijos de un mes con su total.
async function listarPorPeriodo(anio, mes) {
  const costos = await prisma.costoFijo.findMany({
    where: { anio, mes },
    orderBy: { nombre: "asc" },
  });

  const lista = costos.map((costo) => ({ ...costo, monto: Number(costo.monto) }));

  return {
    anio,
    mes,
    total: lista.reduce((suma, costo) => suma + costo.monto, 0),
    costos: lista,
  };
}

// Registra un costo fijo y lo devuelve. No se repite el mismo nombre en el mismo mes y año (MER final).
async function registrar(datos, usuarioId = null) {
  const repetido = await prisma.costoFijo.findFirst({
    where: {
      anio: datos.anio,
      mes: datos.mes,
      nombre: { equals: datos.nombre, mode: "insensitive" },
    },
  });

  if (repetido) {
    throw conflicto(`Ya existe el costo fijo "${repetido.nombre}" en ${datos.mes}/${datos.anio}`);
  }

  const costo = await prisma.costoFijo.create({ data: datos });

  await registrarCambio(
    usuarioId,
    "CREAR",
    costo.id,
    `Costo fijo "${costo.nombre}" de $${costo.monto} en ${costo.mes}/${costo.anio}`
  );

  return { ...costo, monto: Number(costo.monto) };
}

// Elimina un costo fijo (por ejemplo, si se ingresó en el mes equivocado). 404 si no existe.
async function eliminar(id, usuarioId = null) {
  const costo = await prisma.costoFijo.findUnique({ where: { id } });

  if (!costo) {
    throw noEncontrado("El costo fijo no existe");
  }

  await prisma.costoFijo.delete({ where: { id } });

  await registrarCambio(
    usuarioId,
    "ELIMINAR",
    id,
    `Costo fijo "${costo.nombre}" de $${costo.monto} en ${costo.mes}/${costo.anio}`
  );

  return costo;
}

module.exports = {
  listarPorPeriodo,
  registrar,
  eliminar,
};