// Lógica de negocio para disponibilidad horaria de trabajadores (RF-11).
const prisma = require("../config/prisma");

const includeTrabajador = {
  trabajador: {
    select: {
      id: true,
      rut: true,
      nombre: true,
      telefono: true,
      activo: true,
      roles: {
        include: {
          rolTecnico: true,
        },
      },
    },
  },
};

function formatearBloque(bloque) {
  if (!bloque) return null;
  return {
    ...bloque,
    trabajador: bloque.trabajador
      ? {
          ...bloque.trabajador,
          roles: Array.isArray(bloque.trabajador.roles)
            ? bloque.trabajador.roles
                .map((r) => (typeof r === "string" ? r : r.rolTecnico?.nombre))
                .filter(Boolean)
            : [],
        }
      : undefined,
  };
}

async function listarDisponibilidades({ trabajadorId } = {}) {
  const bloques = await prisma.disponibilidad.findMany({
    where: trabajadorId ? { trabajadorId: Number(trabajadorId) } : undefined,
    include: includeTrabajador,
    orderBy: { inicio: "asc" },
  });
  return bloques.map(formatearBloque);
}

async function obtenerDisponibilidadPorId(id) {
  return prisma.disponibilidad.findUnique({
    where: { id: Number(id) },
    include: includeTrabajador,
  });
}

async function crearDisponibilidad(datos, usuarioId) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: Number(datos.trabajadorId) },
  });

  if (!trabajador) {
    const err = new Error("El trabajador seleccionado no existe");
    err.status = 404;
    throw err;
  }

  if (!trabajador.activo) {
    const err = new Error(
      "No se puede registrar disponibilidad para un trabajador inactivo"
    );
    err.status = 400;
    throw err;
  }

  const nueva = await prisma.disponibilidad.create({
    data: {
      trabajadorId: trabajador.id,
      inicio: new Date(datos.inicio),
      termino: new Date(datos.termino),
    },
    include: includeTrabajador,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "CREAR",
      entidad: "Disponibilidad",
      entidadId: nueva.id,
      detalle: `Registró disponibilidad para ${trabajador.nombre} (${new Date(datos.inicio).toISOString()} a ${new Date(datos.termino).toISOString()})`,
    },
  });

  return formatearBloque(nueva);
}

async function actualizarDisponibilidad(id, datos, usuarioId) {
  const existente = await obtenerDisponibilidadPorId(id);
  if (!existente) return null;

  if (!existente.trabajador.activo) {
    const err = new Error(
      "No se puede modificar la disponibilidad de un trabajador inactivo"
    );
    err.status = 400;
    throw err;
  }

  const nuevoInicio = datos.inicio ? new Date(datos.inicio) : existente.inicio;
  const nuevoTermino = datos.termino ? new Date(datos.termino) : existente.termino;

  if (nuevoTermino <= nuevoInicio) {
    const err = new Error("La hora de término debe ser posterior a la hora de inicio");
    err.status = 400;
    throw err;
  }

  const actualizada = await prisma.disponibilidad.update({
    where: { id: Number(id) },
    data: {
      inicio: nuevoInicio,
      termino: nuevoTermino,
    },
    include: includeTrabajador,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Disponibilidad",
      entidadId: actualizada.id,
      detalle: `Modificó bloque de disponibilidad #${actualizada.id} de ${existente.trabajador.nombre}`,
    },
  });

  return formatearBloque(actualizada);
}

async function eliminarDisponibilidad(id, usuarioId) {
  const existente = await obtenerDisponibilidadPorId(id);
  if (!existente) return null;

  await prisma.disponibilidad.delete({
    where: { id: Number(id) },
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "ELIMINAR",
      entidad: "Disponibilidad",
      entidadId: Number(id),
      detalle: `Eliminó bloque de disponibilidad #${id} de ${existente.trabajador.nombre}`,
    },
  });

  return formatearBloque(existente);
}

module.exports = {
  listarDisponibilidades,
  obtenerDisponibilidadPorId,
  crearDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
};