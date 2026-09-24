const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});