// M2 · Constantes y utilidades compartidas por las pantallas de personal y asignaciones.
export const ROLES_DISPONIBLES = [
  { valor: "CAMARA", etiqueta: "Cámara" },
  { valor: "AUDIO", etiqueta: "Audio" },
  { valor: "OPERADOR_SWITCH", etiqueta: "Operador de switch" },
  { valor: "INSTALACION_TECNICA", etiqueta: "Instalación técnica" },
  { valor: "RELATOR", etiqueta: "Relator" },
];

export const ETIQUETAS_ROL = Object.fromEntries(
  ROLES_DISPONIBLES.map((r) => [r.valor, r.etiqueta])
);

export const ETIQUETAS_ASISTENCIA = {
  PENDIENTE: "Pendiente",
  ASISTIO: "Asistió",
  NO_ASISTIO: "No asistió",
};

export const TONO_ASISTENCIA = {
  PENDIENTE: "neutro",
  ASISTIO: "exito",
  NO_ASISTIO: "error",
};

export const TONO_ESTADO_HISTORIAL = {
  REEMPLAZADO: "info",
  REEMPLAZADA: "info",
  RETIRADO: "error",
  RETIRADA: "error",
};

export const puedeGestionar = (rol) => ["DUENO", "ADMIN_DESARROLLO"].includes(rol);

// Soporta tanto arreglos de strings como objetos anidados devueltos por relaciones de Prisma.
export function normalizarRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => (typeof r === "string" ? r : r?.rolTecnico?.nombre || r?.nombre || ""))
    .filter(Boolean);
}

export function extraerFechaYHora(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${min}` };
}