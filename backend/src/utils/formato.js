// Formato de respuesta compartido por los services de transmisiones.

// Prisma entrega los Decimal como texto; se pasan a número para el frontend.
function formatearTransmision(transmision) {
  return {
    ...transmision,
    precioBase: Number(transmision.precioBase),
    ajuste: Number(transmision.ajuste),
    precioCotizado: Number(transmision.precioCotizado),
  };
}

module.exports = { formatearTransmision };
