// M3 · Kits (RF 3.2). Lo usa kit.controller.js.
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { recargoPorCategoria } = require("./cotizacion.service");
const { noEncontrado, conflicto, datosInvalidos } = require("../utils/errores");

// Composición mínima acordada con el cliente: si falta alguno, se advierte.
const TIPOS_BASICOS = ["CAMARA", "TRIPODE", "MICROFONO", "SWITCH"];
const NOMBRE_TIPO = { CAMARA: "cámara", TRIPODE: "trípode", MICROFONO: "micrófono", SWITCH: "switch", OTRO: "otro" };

const incluirEquipos = {
  equipos: {
    select: { id: true, nombre: true, tipo: true, estado: true, numeroSerie: true },
    orderBy: { nombre: "asc" },
  },
};

function faltantes(equipos) {
  return TIPOS_BASICOS.filter((tipo) => !equipos.some((equipo) => equipo.tipo === tipo));
}

function formatear(kit) {
  return {
    ...kit,
    recargo: recargoPorCategoria(kit.categoria),
    faltantes: faltantes(kit.equipos).map((tipo) => NOMBRE_TIPO[tipo]),
  };
}

async function listar() {
  const kits = await prisma.kit.findMany({ include: incluirEquipos, orderBy: { nombre: "asc" } });
  return kits.map(formatear);
}

async function obtener(id) {
  const kit = await prisma.kit.findUnique({ where: { id }, include: incluirEquipos });
  if (!kit) throw noEncontrado("Kit no encontrado");
  return formatear(kit);
}

async function validarEquipos(equipoIds, kitId) {
  const equipos = await prisma.equipo.findMany({
    where: { id: { in: equipoIds } },
    select: { id: true, nombre: true, tipo: true, estado: true, kitId: true },
  });
  if (equipos.length !== equipoIds.length) throw datosInvalidos("Uno o más equipos no están registrados");

  // Los que ya son de este kit pueden quedarse aunque hoy no estén disponibles; los nuevos, no.
  const noDisponibles = equipos.filter((equipo) => equipo.estado !== "DISPONIBLE" && (kitId === null || equipo.kitId !== kitId));
  if (noDisponibles.length) {
    throw conflicto(`Solo se incorporan equipos disponibles. No lo están: ${noDisponibles.map((e) => e.nombre).join(", ")}`);
  }
  const enOtroKit = equipos.filter((equipo) => equipo.kitId && equipo.kitId !== kitId);
  if (enOtroKit.length) {
    throw conflicto(`Estos equipos ya pertenecen a otro kit: ${enOtroKit.map((e) => e.nombre).join(", ")}`);
  }
  return equipos;
}

async function guardar(datos, usuarioId, id = null) {
  const { equipoIds, aceptarAdvertencia, ...campos } = datos;
  if (id !== null && !(await prisma.kit.findUnique({ where: { id }, select: { id: true } }))) {
    throw noEncontrado("Kit no encontrado");
  }

  const equipos = await validarEquipos(equipoIds, id);
  const falta = faltantes(equipos).map((tipo) => NOMBRE_TIPO[tipo]);
  const advertencias = [];
  if (falta.length) {
    const aviso = `Al kit le falta: ${falta.join(", ")}`;
    if (campos.enCondiciones && !aceptarAdvertencia) {
      throw conflicto(`${aviso}. Para marcarlo en condiciones de salir, acepta la advertencia`);
    }
    advertencias.push(aviso);
  }

  try {
    const kit = await prisma.$transaction(async (tx) => {
      const guardado = id === null
        ? await tx.kit.create({ data: campos })
        : await tx.kit.update({ where: { id }, data: campos });

      // Los equipos que salen del kit quedan como repuestos sueltos.
      if (id !== null) {
        await tx.equipo.updateMany({ where: { kitId: id, id: { notIn: equipoIds } }, data: { kitId: null } });
      }
      await tx.equipo.updateMany({ where: { id: { in: equipoIds } }, data: { kitId: guardado.id } });

      await auditoria.registrar(tx, {
        usuarioId,
        modulo: "M3",
        accion: id === null ? "CREAR" : "EDITAR",
        entidad: "Kit",
        entidadId: guardado.id,
        detalle: `${id === null ? "Creó" : "Modificó"} el kit ${guardado.nombre} (${guardado.categoria}, ${equipoIds.length} equipos, ${guardado.enCondiciones ? "en condiciones" : "no está en condiciones"} de salir)${falta.length ? `; aceptó que falta: ${falta.join(", ")}` : ""}`,
      });
      return tx.kit.findUnique({ where: { id: guardado.id }, include: incluirEquipos });
    });
    return { kit: formatear(kit), advertencias };
  } catch (error) {
    if (error.code === "P2002") throw conflicto("Ya existe un kit con ese nombre");
    throw error;
  }
}

module.exports = { listar, obtener, guardar, faltantes, TIPOS_BASICOS };
