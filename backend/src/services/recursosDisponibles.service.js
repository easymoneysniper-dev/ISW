// Trabajadores y kits libres para el horario de una transmisión (Requisito 1.1: se muestran antes de guardar).
// No confundir con disponibilidad.service.js de M2, que gestiona los bloques de horario de cada trabajador.
// Lo usa controllers/transmision.controller.js. Habla con la BD a través de config/prisma.js.
const prisma = require("../config/prisma");
const { hayConflicto } = require("../utils/horario");

// Transmisiones que todavía tienen personal y kits reservados.
const ESTADOS_QUE_RESERVAN = ["COTIZADA", "ACEPTADA", "CONFIRMADA"];
const MARGEN_MS = 2 * 24 * 60 * 60 * 1000; // el traslado máximo es 24 h; se busca con holgura

// Transmisiones que chocan con el horario pedido (incluye el tiempo de traslado).
async function transmisionesEnConflicto(horario, excluirId) {
  const cercanas = await prisma.transmision.findMany({
    where: {
      ...(excluirId && { id: { not: excluirId } }),
      estado: { in: ESTADOS_QUE_RESERVAN },
      inicio: { lt: new Date(horario.termino.getTime() + MARGEN_MS) },
      termino: { gt: new Date(horario.inicio.getTime() - MARGEN_MS) },
    },
    select: {
      id: true,
      inicio: true,
      termino: true,
      tiempoTrasladoMin: true,
      asignaciones: { where: { estado: "ASIGNADO" }, select: { trabajadorId: true } },
      kits: { select: { kitId: true } },
    },
  });

  return cercanas.filter((otra) => hayConflicto(horario, otra));
}

// Devuelve { trabajadores, kits } libres para el horario.
// Trabajador disponible: activo, con un bloque de disponibilidad que cubre el horario
// y sin otra transmisión que choque. Kit disponible: en condiciones de salir y sin choque.
async function consultar({ inicio, termino, tiempoTrasladoMin = 0, excluirId }) {
  const conflictos = await transmisionesEnConflicto({ inicio, termino, tiempoTrasladoMin }, excluirId);
  const trabajadoresOcupados = new Set(conflictos.flatMap((t) => t.asignaciones.map((a) => a.trabajadorId)));
  const kitsOcupados = new Set(conflictos.flatMap((t) => t.kits.map((k) => k.kitId)));

  const [trabajadores, kits] = await Promise.all([
    prisma.trabajador.findMany({
      where: {
        activo: true,
        disponibilidades: { some: { inicio: { lte: inicio }, termino: { gte: termino } } },
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        roles: { select: { rolTecnico: { select: { nombre: true } } } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.kit.findMany({
      where: { enCondiciones: true },
      select: { id: true, nombre: true, categoria: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return {
    trabajadores: trabajadores
      .filter((trabajador) => !trabajadoresOcupados.has(trabajador.id))
      .map(({ roles, ...trabajador }) => ({ ...trabajador, roles: roles.map((r) => r.rolTecnico.nombre) })),
    kits: kits.filter((kit) => !kitsOcupados.has(kit.id)),
  };
}

module.exports = { consultar, transmisionesEnConflicto };
