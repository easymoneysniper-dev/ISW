// Común · Nombres y tonos de los estados de una transmisión, y conversión de fechas para los formularios.
export const NOMBRE_ESTADO = {
  COTIZADA: "Cotizada", ACEPTADA: "Aceptada", CONFIRMADA: "Confirmada", REALIZADA: "Realizada",
  RENDIDA: "Rendida", CERRADA: "Cerrada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada",
};

export const TONO_ESTADO = {
  COTIZADA: "info", ACEPTADA: "info", CONFIRMADA: "exito", REALIZADA: "exito",
  RENDIDA: "exito", CERRADA: "neutro", RECHAZADA: "error", CANCELADA: "error",
};

export const ZONAS = { LOCAL: "Local", REGIONES: "Regiones" };

const dos = (n) => String(n).padStart(2, "0");
const fechaLocal = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const horaLocal = (d) => `${dos(d.getHours())}:${dos(d.getMinutes())}`;

export const hoyLocal = () => fechaLocal(new Date());

// ISO del backend → { fecha, horaInicio, horaTermino } en la hora local del navegador (para editar).
export function horarioDesdeIso(inicioIso, terminoIso) {
  const inicio = new Date(inicioIso);
  const termino = new Date(terminoIso);
  return { fecha: fechaLocal(inicio), horaInicio: horaLocal(inicio), horaTermino: horaLocal(termino) };
}

// { fecha, horaInicio, horaTermino } → { inicio, termino } en ISO, o { error }.
// Si la hora de término es menor que la de inicio, el evento termina al día siguiente.
export function horarioAIso({ fecha, horaInicio, horaTermino }) {
  if (!fecha || !horaInicio || !horaTermino) return { error: "Completa la fecha, la hora de inicio y la hora de término." };
  const inicio = new Date(`${fecha}T${horaInicio}`);
  const termino = new Date(`${fecha}T${horaTermino}`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(termino.getTime())) return { error: "La fecha o las horas no son válidas." };
  if (inicio < new Date()) return { error: "El inicio ya pasó: elige una fecha y hora futuras." };
  if (horaTermino === horaInicio) return { error: "La hora de término debe ser distinta de la de inicio." };
  const diaSiguiente = horaTermino < horaInicio;
  if (diaSiguiente) termino.setDate(termino.getDate() + 1);
  return { inicio: inicio.toISOString(), termino: termino.toISOString(), diaSiguiente };
}

const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;

// Vista previa de la cotización mientras se llena el formulario; el valor oficial lo calcula el backend (RF 1.2).
export function cotizacionPrevia({ precioBase, ajuste, inicio, termino, zona, cantidadKits = 0 }) {
  const precio = Number(precioBase || 0) + Number(ajuste || 0);
  const duracion = inicio && termino ? new Date(termino) - new Date(inicio) : 0;
  const requiereAdelanto = duracion >= CINCO_HORAS_MS || cantidadKits >= 3 || zona === "REGIONES";
  return { precio, requiereAdelanto };
}
