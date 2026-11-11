// M3 · Salida, retorno e incidentes de equipos (RF 3.3 y 3.4). Lo usa movimiento.controller.js.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { fechaChile } = require("../utils/horario");
const { noEncontrado, conflicto, datosInvalidos } = require("../utils/errores");

// Realizada permite registrar la salida justo después del evento.
const ESTADOS_CON_SALIDA = ["CONFIRMADA", "REALIZADA"];
const ESTADO_SEGUN_INCIDENTE = { DANO: "DANADO", PERDIDA: "PERDIDO", ROBO: "PERDIDO" };
const TIPOS_SEGUN_RETORNO = { DANADO: ["DANO"], NO_DEVUELTO: ["PERDIDA", "ROBO"] };

const hoy = () => new Date(`${fechaChile(new Date())}T00:00:00.000Z`);

const incluirSalida = {
  equipo: { select: { id: true, nombre: true, tipo: true, numeroSerie: true, estado: true, kit: { select: { nombre: true } } } },
  responsable: { select: { id: true, nombre: true } },
  incidente: true,
};

// Salida sin retorno registrado = equipo fuera de bodega.
async function equiposFuera() {
  const abiertas = await prisma.salidaEquipo.findMany({ where: { fechaRetorno: null }, select: { equipoId: true } });
  return new Set(abiertas.map((salida) => salida.equipoId));
}

async function deTransmision(transmisionId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: transmisionId },
    select: {
      id: true, nombreEvento: true, inicio: true, termino: true, lugar: true, estado: true,
      kits: { select: { kitId: true } },
      asignaciones: { where: { estado: "ASIGNADO" }, select: { trabajadorId: true } },
    },
  });
  if (!transmision) throw noEncontrado("Transmisión no encontrada");

  const kitIds = transmision.kits.map((uso) => uso.kitId);
  const asignados = new Set(transmision.asignaciones.map((a) => a.trabajadorId));
  const [salidas, candidatos, fuera, trabajadores] = await Promise.all([
    prisma.salidaEquipo.findMany({ where: { transmisionId }, include: incluirSalida, orderBy: { id: "asc" } }),
    prisma.equipo.findMany({
      where: { estado: "DISPONIBLE", OR: [{ kitId: { in: kitIds } }, { kitId: null }] },
      select: { id: true, nombre: true, tipo: true, numeroSerie: true, kitId: true, kit: { select: { nombre: true } } },
      orderBy: [{ kitId: "asc" }, { nombre: "asc" }],
    }),
    equiposFuera(),
    prisma.trabajador.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);

  const { kits, asignaciones, ...datos } = transmision;
  return {
    transmision: datos,
    salidas,
    equiposElegibles: candidatos
      .filter((equipo) => !fuera.has(equipo.id))
      .map((equipo) => ({ ...equipo, origen: equipo.kitId ? "KIT" : "REPUESTO" })),
    // Primero los trabajadores asignados a la transmisión.
    responsables: trabajadores
      .map((t) => ({ ...t, asignado: asignados.has(t.id) }))
      .sort((a, b) => Number(b.asignado) - Number(a.asignado)),
  };
}

async function registrarSalidas({ transmisionId, salidas }, usuarioId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: transmisionId },
    select: { id: true, nombreEvento: true, estado: true, kits: { select: { kitId: true } } },
  });
  if (!transmision) throw noEncontrado("Transmisión no encontrada");
  if (!ESTADOS_CON_SALIDA.includes(transmision.estado)) {
    throw conflicto(`Solo salen equipos para transmisiones Confirmadas o Realizadas (estado actual: ${transmision.estado})`);
  }

  const equipoIds = salidas.map((s) => s.equipoId);
  const responsableIds = [...new Set(salidas.map((s) => s.responsableId))];
  const [equipos, responsables, fuera] = await Promise.all([
    prisma.equipo.findMany({ where: { id: { in: equipoIds } }, select: { id: true, nombre: true, estado: true, kitId: true } }),
    prisma.trabajador.findMany({ where: { id: { in: responsableIds }, activo: true }, select: { id: true } }),
    equiposFuera(),
  ]);
  if (equipos.length !== equipoIds.length) throw datosInvalidos("Uno o más equipos no están registrados");
  if (responsables.length !== responsableIds.length) throw datosInvalidos("Cada salida necesita un trabajador responsable activo");

  const kitsAsignados = new Set(transmision.kits.map((uso) => uso.kitId));
  for (const equipo of equipos) {
    if (equipo.kitId && !kitsAsignados.has(equipo.kitId)) {
      throw conflicto(`${equipo.nombre} pertenece a un kit que no está asignado a esta transmisión`);
    }
    if (equipo.estado !== "DISPONIBLE") throw conflicto(`${equipo.nombre} no está disponible (estado: ${equipo.estado})`);
    if (fuera.has(equipo.id)) throw conflicto(`${equipo.nombre} ya está fuera de bodega y no ha vuelto`);
  }

  return prisma.$transaction(async (tx) => {
    const ahora = new Date();
    const creadas = [];
    for (const salida of salidas) {
      creadas.push(await tx.salidaEquipo.create({
        data: { transmisionId, equipoId: salida.equipoId, responsableId: salida.responsableId, fechaSalida: ahora },
        include: incluirSalida,
      }));
    }
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M3", accion: "SALIDA", entidad: "Transmision", entidadId: transmisionId,
      detalle: `Registró la salida de ${creadas.length} equipo(s) para ${transmision.nombreEvento}: ${creadas.map((s) => s.equipo.nombre).join(", ")}`,
    });
    return creadas;
  });
}

async function registrarRetorno(salidaId, estadoRetorno, usuarioId) {
  const salida = await prisma.salidaEquipo.findUnique({ where: { id: salidaId }, include: incluirSalida });
  if (!salida) throw noEncontrado("Salida no encontrada");
  if (salida.fechaRetorno) throw conflicto(`El retorno de ${salida.equipo.nombre} ya fue registrado`);

  const actualizada = await prisma.$transaction(async (tx) => {
    const resultado = await tx.salidaEquipo.update({
      where: { id: salidaId },
      data: { fechaRetorno: new Date(), estadoRetorno },
      include: incluirSalida,
    });
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M3", accion: "RETORNO", entidad: "SalidaEquipo", entidadId: salidaId,
      detalle: `Retorno de ${salida.equipo.nombre}: ${estadoRetorno}`,
    });
    return resultado;
  });

  const requiereIncidente = estadoRetorno !== "BUEN_ESTADO";
  return {
    ...actualizada,
    requiereIncidente,
    advertencias: requiereIncidente
      ? [`Registra el incidente de ${salida.equipo.nombre} (responsable: ${salida.responsable.nombre})`]
      : [],
  };
}

async function registrarIncidente(salidaId, { tipo, observacion }, usuarioId) {
  const salida = await prisma.salidaEquipo.findUnique({ where: { id: salidaId }, include: incluirSalida });
  if (!salida) throw noEncontrado("Salida no encontrada");
  if (!salida.fechaRetorno || salida.estadoRetorno === "BUEN_ESTADO") {
    throw conflicto("Solo se registra un incidente de un equipo cuyo retorno quedó como dañado o no devuelto");
  }
  if (salida.incidente) throw conflicto(`${salida.equipo.nombre} ya tiene un incidente registrado en esta transmisión`);
  if (!TIPOS_SEGUN_RETORNO[salida.estadoRetorno].includes(tipo)) {
    throw datosInvalidos(salida.estadoRetorno === "DANADO"
      ? "El equipo volvió dañado: el incidente debe ser de tipo DANO"
      : "El equipo no volvió: el incidente debe ser PERDIDA o ROBO");
  }

  return prisma.$transaction(async (tx) => {
    const incidente = await tx.incidente.create({ data: { tipo, observacion, fecha: hoy(), salidaId } });
    await tx.equipo.update({ where: { id: salida.equipo.id }, data: { estado: ESTADO_SEGUN_INCIDENTE[tipo] } });
    await auditoria.registrar(tx, {
      usuarioId, modulo: "M3", accion: "INCIDENTE", entidad: "Equipo", entidadId: salida.equipo.id,
      detalle: `Incidente ${tipo} de ${salida.equipo.nombre} (responsable: ${salida.responsable.nombre}): ${observacion}`,
    });
    return { ...incidente, equipo: { ...salida.equipo, estado: ESTADO_SEGUN_INCIDENTE[tipo] }, responsable: salida.responsable };
  });
}

module.exports = { deTransmision, registrarSalidas, registrarRetorno, registrarIncidente };
