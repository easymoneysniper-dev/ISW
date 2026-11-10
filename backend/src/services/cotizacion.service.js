// Cálculo de la cotización y del adelanto (Requisito 1.2).
// Lo usan los services de transmisiones y, cuando se asignen o retiren kits, el de M3 (Requisito 3.5):
//   const { recargoPorCategoria, recalcular } = require("./cotizacion.service");
//   await tx.transmisionKit.create({ data: { transmisionId, kitId, recargoAplicado: recargoPorCategoria(kit.categoria) } });
//   await recalcular(tx, transmisionId);

// Recargo sobre el precio base por cada kit, según su categoría (%).
const RECARGO_POR_CATEGORIA = { NUEVO: 15, INTERMEDIO: 10, ANTIGUO: 0 };
const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;
const KITS_PARA_ADELANTO = 3;

function recargoPorCategoria(categoria) {
  return RECARGO_POR_CATEGORIA[categoria] ?? 0;
}

// Precio cotizado = precio base + recargos de los kits + ajuste negociado.
// Requiere adelanto del 50 % si dura 5 horas o más, usa 3 kits o más o es en regiones.
// "recargos" es la lista de porcentajes de los kits asignados (ej: [15, 10, 0]).
function calcularCotizacion({ precioBase, ajuste, inicio, termino, zona, recargos = [] }) {
  const base = Number(precioBase);
  const porcentajeTotal = recargos.reduce((suma, recargo) => suma + Number(recargo), 0);
  const precioCotizado = base + Math.round((base * porcentajeTotal) / 100) + Number(ajuste);

  const requiereAdelanto =
    termino - inicio >= CINCO_HORAS_MS || recargos.length >= KITS_PARA_ADELANTO || zona === "REGIONES";

  return { precioCotizado, requiereAdelanto };
}

// Vuelve a calcular y guarda la cotización de una transmisión con sus kits actuales.
// "db" es prisma o la transacción en curso.
async function recalcular(db, transmisionId) {
  const transmision = await db.transmision.findUnique({
    where: { id: transmisionId },
    include: { kits: { select: { recargoAplicado: true } } },
  });

  const cotizacion = calcularCotizacion({
    ...transmision,
    recargos: transmision.kits.map((kit) => kit.recargoAplicado),
  });

  return db.transmision.update({ where: { id: transmisionId }, data: cotizacion });
}

module.exports = { RECARGO_POR_CATEGORIA, recargoPorCategoria, calcularCotizacion, recalcular };
