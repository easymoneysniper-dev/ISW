// Lógica de negocio para asignación, comisiones, reemplazos, retiros y asistencia (RF-12 a RF-16).
const prisma = require("../config/prisma");
const auditoria = require("./auditoria.service");
const { noEncontrado, conflicto } = require("../utils/errores");

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
  reemplazaA: {
    include: {
      trabajador: {
        select: { id: true, nombre: true, rut: true },
      },
    },
  },
  reemplazadaPor: {
    include: {
      trabajador: {
        select: { id: true, nombre: true, rut: true },
      },
    },
  },
};

function formatearAsignacion(a, precioCotizado = 0) {
  if (!a) return null;
  const pct =
    a.porcentajeComision !== null && a.porcentajeComision !== undefined
      ? Number(a.porcentajeComision)
      : null;
  const precio = Number(precioCotizado || 0);
  // Solo devengan comisión las asignaciones en estado ASIGNADO que no tengan inasistencia marcada
  const devengaComision =
    a.estado === "ASIGNADO" && a.asistencia !== "NO_ASISTIO" && pct !== null;
  const montoComision = devengaComision ? Math.round((precio * pct) / 100) : 0;

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
    reemplazaAId: a.reemplazaAId,
    reemplazaANombre: a.reemplazaA?.trabajador?.nombre || null,
    reemplazadaPorNombre: a.reemplazadaPor?.trabajador?.nombre || null,
    creadoEn: a.creadoEn,
    actualizadoEn: a.actualizadoEn,
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

    if (inicioEvento < finOtra && terminoEvento > iniOtra) {
      advertencias.push(
        `Choque de horario: ya está asignado a la transmisión "${otra.transmision.nombreEvento}".`
      );
      continue;
    }

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
  const todasFormateadas = transmision.asignaciones.map((a) =>
    formatearAsignacion(a, precioCotizado)
  );

  const asignacionesActivas = todasFormateadas.filter((a) => a.estado === "ASIGNADO");
  const historialCambiosAsignacion = todasFormateadas.filter(
    (a) => a.estado !== "ASIGNADO"
  );

  const sumaPorcentajes = Number(
    asignacionesActivas
      .filter((a) => a.asistencia !== "NO_ASISTIO")
      .reduce((acc, a) => acc + (a.porcentajeComision || 0), 0)
      .toFixed(2)
  );
  const totalComisiones = asignacionesActivas.reduce(
    (acc, a) => acc + (a.montoComision || 0),
    0
  );
  const montoRestante = precioCotizado - totalComisiones;

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
      camarasUtilizadas: transmision.camarasUtilizadas,
      tiempoTrasladoMin: transmision.tiempoTrasladoMin,
      precioCotizado,
      cliente: transmision.cliente?.nombre || "",
    },
    asignaciones: asignacionesActivas,
    historialAsignaciones: historialCambiosAsignacion,
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

  if (!trabajador.activo) {
    const err = new Error(
      "No se puede asignar a un trabajador inactivo. Solo se permite asignar personal activo."
    );
    err.status = 400;
    throw err;
  }

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

  const yaAsignado = await prisma.asignacion.findFirst({
    where: {
      transmisionId: transmision.id,
      trabajadorId: trabajador.id,
      estado: "ASIGNADO",
    },
  });

  if (yaAsignado) {
    const err = new Error(
      "Este trabajador ya se encuentra asignado a esta transmisión."
    );
    err.status = 400;
    throw err;
  }

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

async function reemplazarTrabajador(asignacionOriginalId, datos, usuarioId) {
  const original = await prisma.asignacion.findUnique({
    where: { id: Number(asignacionOriginalId) },
    include: {
      transmision: true,
      trabajador: true,
      roles: { include: { rolTecnico: true } },
    },
  });

  if (!original) {
    const err = new Error("La asignación que intentas reemplazar no existe");
    err.status = 404;
    throw err;
  }

  if (original.estado !== "ASIGNADO") {
    const err = new Error(
      `Solo se puede reemplazar una asignación activa (estado actual: ${original.estado})`
    );
    err.status = 400;
    throw err;
  }

  if (Number(datos.nuevoTrabajadorId) === original.trabajadorId) {
    const err = new Error("El trabajador reemplazante debe ser distinto al trabajador original");
    err.status = 400;
    throw err;
  }

  const nuevoTrabajador = await prisma.trabajador.findUnique({
    where: { id: Number(datos.nuevoTrabajadorId) },
    include: {
      roles: { include: { rolTecnico: true } },
    },
  });

  if (!nuevoTrabajador) {
    const err = new Error("El trabajador reemplazante seleccionado no existe");
    err.status = 404;
    throw err;
  }

  if (!nuevoTrabajador.activo) {
    const err = new Error(
      "No se puede asignar como reemplazo a un trabajador inactivo."
    );
    err.status = 400;
    throw err;
  }

  const yaAsignadoEnEvento = await prisma.asignacion.findFirst({
    where: {
      transmisionId: original.transmisionId,
      trabajadorId: nuevoTrabajador.id,
      estado: "ASIGNADO",
    },
  });

  if (yaAsignadoEnEvento) {
    const err = new Error(
      `El trabajador ${nuevoTrabajador.nombre} ya tiene una asignación activa en esta transmisión.`
    );
    err.status = 400;
    throw err;
  }

  const rolesOriginales = original.roles.map((r) => r.rolTecnico?.nombre).filter(Boolean);
  const rolesARemplazar =
    Array.isArray(datos.roles) && datos.roles.length > 0 ? datos.roles : rolesOriginales;

  const rolesFichaNuevo = nuevoTrabajador.roles
    .map((r) => r.rolTecnico?.nombre)
    .filter(Boolean);
  const rolesNoSoportados = rolesARemplazar.filter((r) => !rolesFichaNuevo.includes(r));

  if (rolesNoSoportados.length > 0) {
    const err = new Error(
      `El reemplazante ${nuevoTrabajador.nombre} no tiene registrados en su ficha los roles: ${rolesNoSoportados.join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  const evaluacion = await evaluarConflictosHorario(
    nuevoTrabajador.id,
    original.transmision,
    datos.tiempoTrasladoConfigMin
  );

  if (evaluacion.conflictos.length > 0 && !datos.aceptarAdvertencia) {
    const err = new Error(evaluacion.conflictos.join(" "));
    err.status = 409;
    err.requiereConfirmacion = true;
    err.advertencias = evaluacion.conflictos;
    throw err;
  }

  const porcentajeFinal =
    datos.porcentajeComision !== undefined && datos.porcentajeComision !== null
      ? Number(datos.porcentajeComision)
      : original.porcentajeComision !== null
      ? Number(original.porcentajeComision)
      : null;

  const [, nuevaAsignacion] = await prisma.$transaction([
    prisma.asignacion.update({
      where: { id: original.id },
      data: {
        estado: "REEMPLAZADO",
        motivo: datos.motivo.trim(),
      },
    }),
    prisma.asignacion.create({
      data: {
        transmisionId: original.transmisionId,
        trabajadorId: nuevoTrabajador.id,
        estado: "ASIGNADO",
        porcentajeComision: porcentajeFinal,
        reemplazaAId: original.id,
        roles: {
          create: construirRelacionRoles(rolesARemplazar),
        },
      },
      include: includeAsignacion,
    }),
  ]);

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Asignacion",
      entidadId: nuevaAsignacion.id,
      detalle: `Reemplazó a ${original.trabajador.nombre} por ${nuevoTrabajador.nombre} en "${original.transmision.nombreEvento}". Motivo: ${datos.motivo.trim()}`,
    },
  });

  return formatearAsignacion(nuevaAsignacion, original.transmision.precioCotizado);
}

// RF-15: Retiro de una asignación sin reemplazo conservando trazabilidad
async function retirarTrabajador(asignacionId, motivo, usuarioId) {
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
      `Solo se puede retirar una asignación activa (estado actual: ${asignacion.estado})`
    );
    err.status = 400;
    throw err;
  }

  const retirada = await prisma.asignacion.update({
    where: { id: Number(asignacionId) },
    data: {
      estado: "RETIRADO",
      motivo: motivo.trim(),
    },
    include: includeAsignacion,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Asignacion",
      entidadId: retirada.id,
      detalle: `Retiró la asignación de ${asignacion.trabajador.nombre} en "${asignacion.transmision.nombreEvento}". Motivo: ${motivo.trim()}`,
    },
  });

  return formatearAsignacion(retirada, asignacion.transmision.precioCotizado);
}

// RF-16: Registro de asistencia del trabajador asignado
async function registrarAsistencia(asignacionId, asistencia, usuarioId) {
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
      "Solo se puede registrar asistencia para trabajadores con asignación activa (ASIGNADO)"
    );
    err.status = 400;
    throw err;
  }

  const actualizada = await prisma.asignacion.update({
    where: { id: Number(asignacionId) },
    data: {
      asistencia,
    },
    include: includeAsignacion,
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Asignacion",
      entidadId: actualizada.id,
      detalle: `Registró asistencia "${asistencia}" para ${asignacion.trabajador.nombre} en "${asignacion.transmision.nombreEvento}"`,
    },
  });

  return formatearAsignacion(actualizada, asignacion.transmision.precioCotizado);
}

// RF-16: Registro de cámaras efectivamente utilizadas en la transmisión
async function actualizarCamarasUtilizadas(transmisionId, camarasUtilizadas, usuarioId) {
  const transmision = await prisma.transmision.findUnique({
    where: { id: Number(transmisionId) },
  });

  if (!transmision) return null;

  if (
    camarasUtilizadas !== null &&
    camarasUtilizadas > transmision.cantidadCamaras
  ) {
    const err = new Error(
      `Las cámaras utilizadas (${camarasUtilizadas}) no pueden superar las cámaras cotizadas (${transmision.cantidadCamaras}).`
    );
    err.status = 400;
    throw err;
  }

  const actualizada = await prisma.transmision.update({
    where: { id: Number(transmisionId) },
    data: {
      camarasUtilizadas: camarasUtilizadas === null ? null : Number(camarasUtilizadas),
    },
  });

  await prisma.registroCambio.create({
    data: {
      usuarioId: usuarioId || null,
      modulo: "Personal",
      accion: "MODIFICAR",
      entidad: "Transmision",
      entidadId: actualizada.id,
      detalle: `Registró cámaras utilizadas: ${
        actualizada.camarasUtilizadas ?? transmision.cantidadCamaras
      } de ${transmision.cantidadCamaras} cotizadas en "${transmision.nombreEvento}"`,
    },
  });

  return actualizada;
}

// Requisito 2.10: el Contador registra la fecha de pago de la comisión de un trabajador.
// Solo si la transmisión está Rendida, el trabajador quedó asignado con asistencia confirmada,
// tiene porcentaje definido y la comisión aún no se liquida.
async function liquidarComision(asignacionId, fechaLiquidacion, usuarioId) {
  const asignacion = await prisma.asignacion.findUnique({
    where: { id: asignacionId },
    include: {
      transmision: { select: { id: true, nombreEvento: true, estado: true, precioCotizado: true } },
      trabajador: { select: { nombre: true } },
    },
  });
  if (!asignacion) throw noEncontrado("Asignación no encontrada");
 
  if (asignacion.transmision.estado !== "RENDIDA") {
    throw conflicto(
      `Solo se liquidan comisiones de transmisiones Rendidas (estado actual: ${asignacion.transmision.estado})`
    );
  }
  if (asignacion.estado !== "ASIGNADO" || asignacion.asistencia !== "ASISTIO") {
    throw conflicto("Solo se liquida la comisión de un trabajador asignado con asistencia confirmada");
  }
  if (asignacion.porcentajeComision === null) {
    throw conflicto("La asignación no tiene porcentaje de comisión definido (Requisito 2.5)");
  }
  if (asignacion.fechaLiquidacion) throw conflicto("Esta comisión ya fue liquidada");
 
  const porcentaje = Number(asignacion.porcentajeComision);
  const monto = Math.round((Number(asignacion.transmision.precioCotizado) * porcentaje) / 100);
 
  const actualizada = await prisma.$transaction(async (tx) => {
    const resultado = await tx.asignacion.update({
      where: { id: asignacionId },
      data: { fechaLiquidacion },
    });
    await auditoria.registrar(tx, {
      usuarioId,
      modulo: "M2",
      accion: "LIQUIDAR",
      entidad: "Asignacion",
      entidadId: asignacionId,
      detalle: `Liquidó la comisión de ${asignacion.trabajador.nombre} ($${monto}, ${porcentaje} %) de ${asignacion.transmision.nombreEvento}`,
    });
    return resultado;
  });
 
  return {
    asignacionId,
    trabajador: asignacion.trabajador.nombre,
    porcentajeComision: porcentaje,
    montoComision: monto,
    fechaLiquidacion: actualizada.fechaLiquidacion,
  };
}

module.exports = {
  obtenerContextoTransmision,
  asignarTrabajador,
  definirPorcentajeComision,
  reemplazarTrabajador,
  retirarTrabajador,
  registrarAsistencia,
  actualizarCamarasUtilizadas,
};