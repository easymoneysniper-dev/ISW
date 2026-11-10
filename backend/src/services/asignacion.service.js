// Lógica de negocio para asignación de trabajadores (RF-12) y definición de comisiones (RF-13).
const prisma = require("../config/prisma");

const TIEMPO_TRASLADO_DEFECTO_MIN = 60;

const includeAsignacion = {
  trabajador: {
    include: {
      roles: {
        include: { rolTecnico: true },
      },
    },
  },
  roles: {
    include: { rolTecnico: true },
  },
};

function formatearAsignacion(a, precioCotizado = 0) {
  if (!a) return null;
  const pct = a.porcentajeComision !== null && a.porcentajeComision !== undefined
    ? Number(a.porcentajeComision)
    : null;
  const precio = Number(precioCotizado || 0);
  const montoComision = pct !== null ? Math.round((precio * pct) / 100) : 0;

  return {
    id: a.id,
    transmisionId: a.transmisionId,
    trabajadorId: a.trabajadorId,
    estado: a.estado,
    motivo: a.motivo,
    asistencia: a.asistencia,
    fechaLiquidacion: a.fechaLiquidacion,
    porcentajeComision: pct,
    montoComision,
    roles: Array.isArray(a.roles)
      ? a.roles.map((r) => r.rolTecnico?.nombre).filter(Boolean)
      : [],
    trabajador: a.trabajador
      ? {
          id: a.trabajador.id,
          rut: a.trabajador.rut,
          nombre: a.trabajador.nombre,
          telefono: a.trabajador.telefono,
          activo: a.trabajador.activo,
          rolesFicha: Array.isArray(a.trabajador.roles)
            ? a.trabajador.roles.map((r) => r.rolTecnico?.nombre).filter(Boolean)
            : [],
        }
      : undefined,
  };
}

function construirRelacionRoles(nombresRoles = []) {
  const unicos = [...new Set(nombresRoles)];
  return unicos.map((nombre) => ({
    rolTecnico: {
      connectOrCreate: {
        where: { nombre },
        create: { nombre },
      },
    },
  }));
}

async function evaluarConflictosHorario(trabajadorId, transmision, tiempoTrasladoExtraMin) {
  const advertencias = [];
  const inicioEvento = new Date(transmision.inicio);
  const terminoEvento = new Date(transmision.termino);

  // 1. Verificar si tiene al menos un bloque de disponibilidad que cubra todo el horario
  const bloqueCubre = await prisma.disponibilidad.findFirst({
    where: {
      trabajadorId: Number(trabajadorId),
      inicio: { lte: inicioEvento },
      termino: { gte: terminoEvento },
    },
  });

  if (!bloqueCubre) {
    advertencias.push(
      "El trabajador no tiene disponibilidad registrada que cubra todo el horario de la transmisión."
    );
  }

  // 2. Verificar otras asignaciones activas del trabajador para choques o traslado
  const otrasAsignaciones = await prisma.asignacion.findMany({
    where: {
      trabajadorId: Number(trabajadorId),
      estado: "ASIGNADO",
      transmisionId: { not: transmision.id },
      transmision: {
        estado: { notIn: ["CANCELADA", "RECHAZADA"] },
      },
    },
    include: {
      transmision: true,
    },
  });

  const minutosTraslado =
    tiempoTrasladoExtraMin !== undefined
      ? Number(tiempoTrasladoExtraMin)
      : transmision.tiempoTrasladoMin > 0
      ? transmision.tiempoTrasladoMin
      : TIEMPO_TRASLADO_DEFECTO_MIN;

  const margenMs = minutosTraslado * 60 * 1000;

  for (const otra of otrasAsignaciones) {
    const iniOtra = new Date(otra.transmision.inicio);
    const finOtra = new Date(otra.transmision.termino);

    // Choque directo de horario
    if (inicioEvento < finOtra && terminoEvento > iniOtra) {
      advertencias.push(
        `Choque de horario: ya está asignado a la transmisión "${otra.transmision.nombreEvento}".`
      );
      continue;
    }

    // Conflicto de tiempo de traslado entre recintos distintos
    const mismoRecinto =
      (otra.transmision.lugar || "").trim().toLowerCase() ===
      (transmision.lugar || "").trim().toLowerCase();

    if (!mismoRecinto && margenMs > 0) {
      const terminaAntesSinMargen =
        finOtra <= inicioEvento && inicioEvento.getTime() - finOtra.getTime() < margenMs;
      const empiezaDespuesSinMargen =
        terminoEvento <= iniOtra && iniOtra.getTime() - terminoEvento.getTime() < margenMs;

      if (terminaAntesSinMargen || empiezaDespuesSinMargen) {
        advertencias.push(
          `No dispone del tiempo de traslado (${minutosTraslado} min) respecto a la transmisión "${otra.transmision.nombreEvento}" en "${otra.transmision.lugar}".`
        );
      }
    }
  }

  return {
    disponibleTodoHorario: Boolean(bloqueCubre),
    conflictos: advertencias,
  };
}

async function obtenerContextoTransmision(transmisionId, tiempoTrasladoConfigMin) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: Number(transmisionId) },
    include: {
      cliente: true,
      asignaciones: {
        where: { estado: "ASIGNADO" },
        include: includeAsignacion,
        orderBy: { creadoEn: "asc" },
      },
    },
  });

  if (!transmision) {
    const err = new Error("Transmisión no encontrada");
    err.status = 404;
    throw err;
  }

  const precioCotizado = Number(transmision.precioCotizado || 0);
  const asignacionesFormateadas = transmision.asignaciones.map((a) =>
    formatearAsignacion(a, precioCotizado)
  );

  // Resumen financiero RF-13
  const sumaPorcentajes = Number(
    asignacionesFormateadas
      .reduce((acc, a) => acc + (a.porcentajeComision || 0), 0)
      .toFixed(2)
  );
  const totalComisiones = asignacionesFormateadas.reduce(
    (acc, a) => acc + (a.montoComision || 0),
    0
  );
  const montoRestante = precioCotizado - totalComisiones;

  // Evaluar trabajadores activos para destacar a los disponibles en la UI (RF-12)
  const trabajadoresActivos = await prisma.trabajador.findMany({
    where: { activo: true },
    include: {
      roles: { include: { rolTecnico: true } },
    },
    orderBy: { nombre: "asc" },
  });

  const candidatos = await Promise.all(
    trabajadoresActivos.map(async (t) => {
      const evalConflicto = await evaluarConflictosHorario(
        t.id,
        transmision,
        tiempoTrasladoConfigMin
      );
      return {
        id: t.id,
        rut: t.rut,
        nombre: t.nombre,
        telefono: t.telefono,
        activo: t.activo,
        roles: t.roles.map((r) => r.rolTecnico?.nombre).filter(Boolean),
        disponible: evalConflicto.conflictos.length === 0,
        disponibleTodoHorario: evalConflicto.disponibleTodoHorario,
        advertencias: evalConflicto.conflictos,
      };
    })
  );

  // Ordenar destacando primero a los disponibles sin advertencias
  candidatos.sort((a, b) => Number(b.disponible) - Number(a.disponible));

  return {
    transmision: {
      id: transmision.id,
      nombreEvento: transmision.nombreEvento,
      inicio: transmision.inicio,
      termino: transmision.termino,
      lugar: transmision.lugar,
      zona: transmision.zona,
      estado: transmision.estado,
      cantidadCamaras: transmision.cantidadCamaras,
      tiempoTrasladoMin: transmision.tiempoTrasladoMin,
      precioCotizado,
      cliente: transmision.cliente?.nombre || "",
    },
    asignaciones: asignacionesFormateadas,
    resumenComisiones: {
      precioCotizado,
      sumaPorcentajes,
      totalComisiones,
      montoRestante,
    },
    candidatos,
  };
}

async function asignarTrabajador(datos, usuarioId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: Number(datos.transmisionId) },
  });

  if (!transmision) {
    const err = new Error("La transmisión seleccionada no existe");
    err.status = 404;
    throw err;
  }

  if (transmision.estado !== "CONFIRMADA") {
    const err = new Error(
      `Solo se pueden asignar trabajadores a transmisiones en estado CONFIRMADA (estado actual: ${transmision.estado})`
    );
    err.status = 400;
    throw err;
  }

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: Number(datos.trabajadorId) },
    include: {
      roles: { include: { rolTecnico: true } },
    },
  });

  if (!trabajador) {
    const err = new Error("El trabajador seleccionado no existe");
    err.status = 404;
    throw err;
  }

  // Regla obligatoria del profesor: solo permitir asignar a un trabajador activo
  if (!trabajador.activo) {
    const err = new Error(
      "No se puede asignar a un trabajador inactivo. Solo se permite asignar personal activo."
    );
    err.status = 400;
    throw err;
  }

  // Verificar que todos los roles asignados estén registrados en su ficha
  const rolesDelTrabajador = trabajador.roles
    .map((r) => r.rolTecnico?.nombre)
    .filter(Boolean);
  const rolesNoRegistrados = datos.roles.filter(
    (rol) => !rolesDelTrabajador.includes(rol)
  );

  if (rolesNoRegistrados.length > 0) {
    const err = new Error(
      `El trabajador ${trabajador.nombre} no tiene registrados los siguientes roles en su ficha: ${rolesNoRegistrados.join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  // Verificar si ya tiene una asignación activa en esta misma transmisión
  const yaAsignado = await prisma.asignacion.findFirst({
    where: {
      transmisionId: transmision.id,
      trabajadorId: trabajador.id,
      estado: "ASIGNADO",
    },
  });

  if (yaAsignado) {
    const err = new Error(
      "Este trabajador ya se encuentra asignado a esta transmisión. Puedes editar sus roles o comisión."
    );
    err.status = 400;
    throw err;
  }

  // Evaluar disponibilidad, choques de horario y traslado
  const evaluacion = await evaluarConflictosHorario(
    trabajador.id,
    transmision,
    datos.tiempoTrasladoConfigMin
  );

  if (evaluacion.conflictos.length > 0 && !datos.aceptarAdvertencia) {
    const err = new Error(evaluacion.conflictos.join(" "));
    err.status = 409;
    err.requiereConfirmacion = true;
    err.advertencias = evaluacion.conflictos;
    throw err;
  }

  const creada = await prisma.asignacion.create({
    data: {
      transmisionId: transmision.id,
      trabajadorId: trabajador.id,
      estado: "ASIGNADO",
      porcentajeComision:
        datos.porcentajeComision !== undefined && datos.porcentajeComision !== null
          ? datos.porcentajeComision
          : null,
      roles: {
        create: construirRelacionRoles(datos.roles),
      },
    },
    include: includeAsignacion,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "CREAR",
      entidad: "Asignacion",
      entidadId: creada.id,
      detalle: `Asignó a ${trabajador.nombre} en "${transmision.nombreEvento}" con roles: ${datos.roles.join(", ")}${
        evaluacion.conflictos.length > 0 ? " (con advertencia aceptada por el Dueño)" : ""
      }`,
    },
  });

  return formatearAsignacion(creada, transmision.precioCotizado);
}

async function definirPorcentajeComision(asignacionId, porcentajeComision, usuarioId) {
  const asignacion = await prisma.asignacion.findUnique({
    where: { id: Number(asignacionId) },
    include: {
      transmision: true,
      trabajador: true,
    },
  });

  if (!asignacion) return null;

  if (asignacion.estado !== "ASIGNADO") {
    const err = new Error(
      "Solo se puede definir comisión para una asignación activa (ASIGNADO)"
    );
    err.status = 400;
    throw err;
  }

  const actualizada = await prisma.asignacion.update({
    where: { id: Number(asignacionId) },
    data: {
      porcentajeComision: Number(porcentajeComision),
    },
    include: includeAsignacion,
  });

  const montoCalculado = Math.round(
    (Number(asignacion.transmision.precioCotizado) * Number(porcentajeComision)) / 100
  );

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Asignacion",
      entidadId: actualizada.id,
      detalle: `Definió comisión de ${porcentajeComision}% ($${montoCalculado}) para ${asignacion.trabajador.nombre} en "${asignacion.transmision.nombreEvento}"`,
    },
  });

  return formatearAsignacion(actualizada, asignacion.transmision.precioCotizado);
}

module.exports = {
  obtenerContextoTransmision,
  asignarTrabajador,
  definirPorcentajeComision,
};