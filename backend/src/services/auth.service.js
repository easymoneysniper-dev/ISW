// Reglas del inicio de sesión. No conoce req ni res: solo recibe datos y devuelve datos.
// Lo usa auth.controller.js. Habla con la BD a través de config/prisma.js.
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// Devuelve los datos públicos del usuario si el correo y la contraseña son correctos.
// Devuelve null si no existe, está inactivo o la contraseña no coincide.
async function verificarCredenciales(email, password) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.activo) {
    return null;
  }

  // Compara la contraseña escrita con el hash guardado.
  const coincide = await bcrypt.compare(password, usuario.passwordHash);

  if (!coincide) {
    return null;
  }

  // Nunca se devuelve el passwordHash.
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

module.exports = { verificarCredenciales };
