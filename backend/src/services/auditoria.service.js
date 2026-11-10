// Registro de cambios (Requisito 2.3): quién hizo qué y cuándo.
// Lo usan los services de todos los módulos. Recibe "db": prisma o la transacción (tx)
// en curso, para que el cambio y su registro se guarden juntos o ninguno.
function registrar(db, { usuarioId = null, modulo, accion, entidad, entidadId = null, detalle = null }) {
  return db.registroCambio.create({
    data: { usuarioId, modulo, accion, entidad, entidadId, detalle },
  });
}

module.exports = { registrar };
