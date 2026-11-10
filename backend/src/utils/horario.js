// Funciones de fechas y horarios que comparten los módulos.
// Las usan los services de transmisiones, disponibilidad y (a futuro) asignaciones y kits.

const MINUTO_MS = 60 * 1000;

// ¿Dos transmisiones chocan? (Requisitos 2.8 y 3.5)
// Chocan si se superponen o si las separa menos tiempo que el traslado
// indicado para la que empieza después (Requisito 1.1).
// Cada una: { inicio: Date, termino: Date, tiempoTrasladoMin: número }.
function hayConflicto(a, b) {
  const [primera, segunda] = a.inicio <= b.inicio ? [a, b] : [b, a];
  const separacionMs = segunda.inicio - primera.termino;
  return separacionMs < (segunda.tiempoTrasladoMin ?? 0) * MINUTO_MS;
}

// Fecha local de Chile en formato AAAA-MM-DD (para el calendario).
const formatoChile = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function fechaChile(fecha) {
  return formatoChile.format(fecha);
}

module.exports = { hayConflicto, fechaChile };
