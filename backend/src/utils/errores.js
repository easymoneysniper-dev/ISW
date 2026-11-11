// Errores de reglas de negocio. Los lanzan los services; los responde error.middleware.js.
// Así los services no conocen req ni res, y hay un solo lugar que arma las respuestas de error.
//   throw noEncontrado("Cliente no encontrado");          -> 404
//   throw conflicto("Solo se confirma una Aceptada");      -> 409
//   throw datosInvalidos("El ajuste deja el precio en 0"); -> 400
class ErrorNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
  }
}

const datosInvalidos = (mensaje) => new ErrorNegocio(mensaje, 400);
const noEncontrado = (mensaje) => new ErrorNegocio(mensaje, 404);
const conflicto = (mensaje) => new ErrorNegocio(mensaje, 409);

module.exports = { ErrorNegocio, datosInvalidos, noEncontrado, conflicto };
