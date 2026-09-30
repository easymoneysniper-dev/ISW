// Middlewares de acceso. Se ponen en las rutas antes del controller.
//   requireAuth           -> ¿hay sesión iniciada? si no, 401
//   requireRol("DUENO")   -> ¿el rol del usuario puede entrar? si no, 403 (RNF-04)

function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ message: "Debes iniciar sesión" });
  }

  next();
}

// Recibe los roles permitidos: requireRol("DUENO", "CONTADOR").
// Debe ir después de requireAuth.
function requireRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.session.usuario.rol)) {
      return res.status(403).json({ message: "No tienes permiso para esta acción" });
    }

    next();
  };
}

module.exports = { requireAuth, requireRol };
