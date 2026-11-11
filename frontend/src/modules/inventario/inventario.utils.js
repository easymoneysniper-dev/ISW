// M3 · Nombres y tonos de los valores de inventario.
export const TIPOS_EQUIPO = { CAMARA: "Cámara", TRIPODE: "Trípode", MICROFONO: "Micrófono", SWITCH: "Switch", OTRO: "Otro" };
export const ESTADOS_EQUIPO = { DISPONIBLE: "Disponible", DANADO: "Dañado", EN_REPARACION: "En reparación", PERDIDO: "Perdido", DADO_DE_BAJA: "Dado de baja" };
export const CATEGORIAS_KIT = { NUEVO: "Nuevo (15 %)", INTERMEDIO: "Intermedio (10 %)", ANTIGUO: "Antiguo (0 %)" };
export const RETORNOS = { BUEN_ESTADO: "Buen estado", DANADO: "Dañado", NO_DEVUELTO: "No devuelto" };
export const INCIDENTES = { DANO: "Daño", PERDIDA: "Pérdida", ROBO: "Robo" };
export const TIPOS_BASICOS = ["CAMARA", "TRIPODE", "MICROFONO", "SWITCH"];

export const tonoEstadoEquipo = (estado) =>
  ({ DISPONIBLE: "exito", EN_REPARACION: "advertencia", DANADO: "error", PERDIDO: "error" })[estado] ?? "neutro";

export const tonoRetorno = (estado) => ({ BUEN_ESTADO: "exito", DANADO: "error", NO_DEVUELTO: "error" })[estado] ?? "neutro";

export const faltantes = (equipos) => TIPOS_BASICOS.filter((tipo) => !equipos.some((e) => e.tipo === tipo));
