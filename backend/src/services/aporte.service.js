// Reglas y consultas de los acuerdos y aportes de auspiciadores.
// Lo usa aporte.controller.js. reporte.service.js suma los aportes Cumplidos.
// Si una regla no se cumple, lanza un error de negocio y lo responde error.middleware.js.
const prisma = require("../config/prisma");
const { noEncontrado, conflicto, datosInvalidos } = require("../utils/errores");

// Hoy a medianoche UTC, igual que se guardan las fechas sin hora.
function inicioDeHoy() {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
}

// "Atrasado" no se guarda: es un aporte Comprometido con la fecha comprometida vencida.
function estadoActual(aporte, hoy = inicioDeHoy()) {
  if (aporte.estado === "COMPROMETIDO" && aporte.fechaComprometida < hoy) return "ATRASADO";
  return aporte.estado;
}

function formatear(aporte) {
  return {
    ...aporte,
    valorPesos: aporte.valorPesos === null ? null : Number(aporte.valorPesos),
    estadoActual: estadoActual(aporte),
  };
}

// Deja el cambio anotado en el registro de cambios.
function registrarCambio(usuarioId, accion, entidadId, detalle) {
  return prisma.registroCambio.create({
    data: { usuarioId, modulo: "M4", accion, entidad: "Aporte", entidadId, detalle },
  });
}

// Busca un aporte que todavía esté Comprometido (o Atrasado). Lanza 404 o 409 si no.
async function buscarPendiente(id, mensajeSiNoEsta) {
  const aporte = await prisma.aporte.findUnique({ where: { id } });

  if (!aporte) {
    throw noEncontrado("El aporte no existe");
  }

  if (aporte.estado !== "COMPROMETIDO") {
    throw conflicto(mensajeSiNoEsta);
  }

  return aporte;
}

// Todos los acuerdos con su auspiciador y transmisión, del más próximo al más lejano.
async function listar() {
  const aportes = await prisma.aporte.findMany({
    include: {
      auspiciador: { select: { id: true, nombre: true, contacto: true } },
      transmision: { select: { id: true, nombreEvento: true } },
    },
    orderBy: [{ fechaComprometida: "asc" }, { id: "asc" }],
  });

  return aportes.map(formatear);
}

// El Dueño registra el acuerdo; queda Comprometido en el historial del auspiciador.
async function registrarAcuerdo(datos, usuarioId = null) {
  const [auspiciador, transmision] = await Promise.all([
    prisma.auspiciador.findUnique({ where: { id: datos.auspiciadorId } }),
    prisma.transmision.findUnique({ where: { id: datos.transmisionId } }),
  ]);

  if (!auspiciador) {
    throw noEncontrado("El auspiciador no existe");
  }

  if (!transmision) {
    throw noEncontrado("La transmisión no existe");
  }

  // Si es canje, el valor en pesos se ingresa al recibirlo.
  const aporte = await prisma.aporte.create({
    data: { ...datos, valorPesos: datos.tipo === "DINERO" ? datos.valorPesos : null },
  });

  await registrarCambio(
    usuarioId,
    "CREAR",
    aporte.id,
    `Acuerdo ${aporte.tipo} con "${auspiciador.nombre}" para la transmisión ${transmision.id}`
  );

  return formatear(aporte);
}

// El Contador registra la recepción con fecha, comprobante y, si es canje, su valor.
async function registrarRecepcion(id, datos, usuarioId = null) {
  const aporte = await buscarPendiente(
    id,
    "Solo se registra la recepción de un aporte Comprometido o Atrasado"
  );

  if (aporte.tipo === "CANJE" && !datos.valorPesos) {
    throw datosInvalidos("Indica el valor en pesos del canje");
  }

  const actualizado = await prisma.aporte.update({
    where: { id },
    data: {
      estado: "CUMPLIDO",
      fechaRecepcion: datos.fechaRecepcion,
      comprobanteArchivo: datos.comprobanteArchivo,
      valorPesos: aporte.tipo === "CANJE" ? datos.valorPesos : aporte.valorPesos,
    },
  });

  await registrarCambio(usuarioId, "MODIFICAR", id, `Aporte ${id} recibido (Cumplido)`);

  return formatear(actualizado);
}

// Solo el Dueño marca No cumplido, con una observación.
async function marcarNoCumplido(id, observacion, usuarioId = null) {
  await buscarPendiente(id, "Solo se marca como No cumplido un aporte Comprometido o Atrasado");

  const actualizado = await prisma.aporte.update({
    where: { id },
    data: { estado: "NO_CUMPLIDO", observacion },
  });

  await registrarCambio(usuarioId, "MODIFICAR", id, `Aporte ${id} marcado No cumplido`);

  return formatear(actualizado);
}

module.exports = {
  listar,
  registrarAcuerdo,
  registrarRecepcion,
  marcarNoCumplido,
  estadoActual,
};