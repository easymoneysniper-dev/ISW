// Crea el primer usuario (rol DUENO) con los datos ADMIN_* del .env.
// Uso: npm run crear-usuario   (desde la carpeta backend)
require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function crearUsuario() {
  const nombre = process.env.ADMIN_NOMBRE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    throw new Error("Faltan los datos ADMIN_* en el archivo .env");
  }

  if (password === "REEMPLAZA_ESTO" || password.length < 12) {
    throw new Error("Elige una contraseña de al menos 12 caracteres");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("La contraseña supera el límite de 72 bytes");
  }

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    console.log("Ya existe un usuario con ese correo. No se modificó.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      rol: "DUENO",
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
  });

  console.log("Usuario creado correctamente:");
  console.log(usuario);
}

crearUsuario()
  .catch((error) => {
    console.error("No se pudo crear el usuario:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });