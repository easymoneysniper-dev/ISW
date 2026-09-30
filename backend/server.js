const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const bcrypt = require("bcryptjs");

dotenv.config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pool = require("./db");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

if (!process.env.SESSION_SECRET) {
  throw new Error("Falta SESSION_SECRET en el archivo .env");
}

app.use(
  session({
    name: "isw.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 60 * 60 * 1000,
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend funcionando correctamente",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      message: "PostgreSQL conectado correctamente",
      fechaServidorBD: result.rows[0].now,
    });
  } catch (error) {
    console.error("Error PostgreSQL:", error);

    res.status(500).json({
      status: "error",
      message: "No se pudo conectar con PostgreSQL",
    });
  }
});

app.get("/api/transmisiones", async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      message: "Debes iniciar sesión",
    });
  }
  try {
    const transmisiones = await prisma.transmision.findMany({
      include: {
        cliente: true,
      },
      orderBy: {
        inicio: "asc",
      },
    });

    res.json(transmisiones);
  } catch (error) {
    console.error("Error al consultar transmisiones:", error);

    res.status(500).json({
      message: "No se pudieron consultar las transmisiones",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Comprueba que llegaron ambos datos.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 254 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Ingresa un correo y una contraseña válidos",
      });
    }

    // Busca la cuenta en PostgreSQL.
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    // Compara la contraseña ingresada con el hash guardado.
    const coincide = await bcrypt.compare(
      password,
      usuario.passwordHash
    );

    if (!coincide) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    // Crea una sesión nueva después de autenticar al usuario.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    // Guarda la sesión antes de responder a React.
    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    res.json({
      message: "Inicio de sesión correcto",
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    res.status(500).json({
      message: "No se pudo iniciar sesión. Intenta nuevamente.",
    });
  }
});

app.get("/api/sesion", (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      message: "Debes iniciar sesión",
    });
  }

  res.json({
    usuario: req.session.usuario,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error al cerrar sesión:", error);

      return res.status(500).json({
        message: "No se pudo cerrar la sesión",
      });
    }

    res.clearCookie("isw.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.json({ message: "Sesión cerrada correctamente" });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
