// Recibe el comprobante (foto o PDF) que se adjunta a un pago o a un gasto (M4, RF 4.1).
// Va en las rutas ANTES de validate(): multer lee el formulario, guarda el archivo y lo deja en req.file.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const CARPETA = path.join(__dirname, "..", "..", "uploads", "comprobantes");
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// Tipos aceptados y la extensión con que se guardan (no se confía en el nombre que manda el usuario).
const EXTENSIONES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

fs.mkdirSync(CARPETA, { recursive: true });

const subir = multer({
  storage: multer.diskStorage({
    destination: CARPETA,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`);
    },
  }),
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  // Si el tipo no está permitido, el archivo se ignora y req.file queda vacío.
  fileFilter: (req, file, cb) => cb(null, Boolean(EXTENSIONES[file.mimetype])),
}).single("comprobante");

// Sube el archivo del campo "comprobante" y exige que venga. Si falta o no sirve, responde 400.
function exigirComprobante(req, res, next) {
  subir(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "El comprobante no puede pesar más de 5 MB" });
    }

    if (error) return next(error);

    if (!req.file) {
      return res.status(400).json({ message: "Debes adjuntar el comprobante (JPG, PNG o PDF)" });
    }

    next();
  });
}

module.exports = { exigirComprobante };