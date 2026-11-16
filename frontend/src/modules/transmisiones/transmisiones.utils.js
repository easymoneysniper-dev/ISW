// M1 · Reglas de pantalla: quién gestiona y qué acciones permite cada estado.
export const puedeGestionar = (rol) => ["DUENO", "ADMIN_DESARROLLO"].includes(rol);

export const ESTADOS_MODIFICABLES = ["ACEPTADA", "CONFIRMADA"];

export const ESTADO_PAGO = {
  PENDIENTE: "Pendiente", ADELANTO_PAGADO: "Adelanto pagado", PAGADO: "Pagado", ATRASADO: "Atrasado",
};

export const CATEGORIA_KIT = { NUEVO: "Nuevo", INTERMEDIO: "Intermedio", ANTIGUO: "Antiguo" };

export const ASISTENCIA = { PENDIENTE: "Pendiente", ASISTIO: "Asistió", NO_ASISTIO: "No asistió" };
