// Middleware genérico de validación con Zod (Clase 3).
// Se usa en las rutas: validate(esquema, "body" | "params" | "query").
// Si los datos no cumplen el esquema, corta la petición con 400 y no llega al controller.
function validate(schema, target = "body") {
  return (req, res, next) => {
    // req.body llega undefined si no se envió JSON; se trata como objeto vacío.
    const result = schema.safeParse(req[target] ?? {});

    if (!result.success) {
      // En Zod 4 los errores están en error.issues.
      const detalles = result.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensaje: issue.message,
      }));

      return res.status(400).json({
        message: "Revisa los datos enviados",
        detalles,
      });
    }

    // Deja los datos limpios (con trim, minúsculas, etc.) para el controller.
    // En Express 5 req.query es de solo lectura, por eso se guarda aparte.
    if (target === "query") {
      req.datosQuery = result.data;
    } else {
      req[target] = result.data;
    }

    next();
  };
}

module.exports = validate;
