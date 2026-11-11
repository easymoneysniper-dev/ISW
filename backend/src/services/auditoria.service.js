// Registro de cambios (Requisito 2.3): quién hizo qué y cuándo.
// registrar: lo usan los services de todos los módulos. Recibe "db": prisma o la transacción (tx)
// en curso, para que el cambio y su registro se guarden juntos o ninguno.
// listar: consulta del historial para el Dueño (solo lectura: no hay editar ni eliminar).
const prisma = require("../config/prisma");
 
const POR_PAGINA = 50;
 
function registrar(db, { usuarioId = null, modulo, accion, entidad, entidadId = null, detalle = null }) {
  return db.registroCambio.create({
    data: { usuarioId, modulo, accion, entidad, entidadId, detalle },
  });
}
 
// Historial filtrado por fecha, usuario o módulo, del más reciente al más antiguo.
async function listar({ desde, hasta, usuarioId, modulo, pagina = 1 }) {
  const where = {
    ...((desde || hasta) && {
      creadoEn: { ...(desde && { gte: desde }), ...(hasta && { lt: hasta }) },
    }),
    ...(usuarioId && { usuarioId }),
    ...(modulo && { modulo: { equals: modulo, mode: "insensitive" } }),
  };
 
  const [total, registros] = await Promise.all([
    prisma.registroCambio.count({ where }),
    prisma.registroCambio.findMany({
      where,
      include: { usuario: { select: { id: true, nombre: true, rol: true } } },
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);
 
  return { total, pagina, porPagina: POR_PAGINA, registros };
}
 
module.exports = { registrar, listar };