// Carga datos de prueba en la BD LOCAL: roles técnicos, trabajadores con disponibilidad y kits.
// Sirve para probar en Postman lo que depende de otros módulos (ej: disponibilidad, Requisito 1.1).
// Uso: npm run datos-prueba   (desde la carpeta backend). Se puede ejecutar varias veces.
// No usar en el servidor: es solo para pruebas en el PC de cada integrante.
require("dotenv").config();
const prisma = require("../src/config/prisma");

const ROLES = ["Cámara", "Audio", "Operador de switch", "Instalación técnica", "Relator"];

const TRABAJADORES = [
  { rut: "11111111-1", nombre: "Ana Pérez", telefono: "+56 9 1111 1111", roles: ["Cámara", "Audio"] },
  { rut: "22222222-2", nombre: "Bruno Soto", telefono: "+56 9 2222 2222", roles: ["Operador de switch"] },
  { rut: "33333333-3", nombre: "Carla Díaz", telefono: "+56 9 3333 3333", roles: ["Cámara", "Relator"] },
];

const KITS = [
  { nombre: "Kit A (nuevo)", categoria: "NUEVO" },
  { nombre: "Kit B (intermedio)", categoria: "INTERMEDIO" },
  { nombre: "Kit C (antiguo)", categoria: "ANTIGUO" },
];

// Disponibles todo diciembre de 2026 (hora de Chile).
const DISPONIBLE_DESDE = new Date("2026-12-01T00:00:00-03:00");
const DISPONIBLE_HASTA = new Date("2026-12-31T23:59:00-03:00");

async function cargar() {
  for (const nombre of ROLES) {
    await prisma.rolTecnico.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  for (const { roles, ...datos } of TRABAJADORES) {
    const trabajador = await prisma.trabajador.upsert({ where: { rut: datos.rut }, update: {}, create: datos });
    for (const nombre of roles) {
      const rol = await prisma.rolTecnico.findUnique({ where: { nombre } });
      await prisma.trabajadorRol.upsert({
        where: { trabajadorId_rolTecnicoId: { trabajadorId: trabajador.id, rolTecnicoId: rol.id } },
        update: {},
        create: { trabajadorId: trabajador.id, rolTecnicoId: rol.id },
      });
    }
    const yaTiene = await prisma.disponibilidad.count({ where: { trabajadorId: trabajador.id } });
    if (!yaTiene) {
      await prisma.disponibilidad.create({
        data: { trabajadorId: trabajador.id, inicio: DISPONIBLE_DESDE, termino: DISPONIBLE_HASTA },
      });
    }
  }

  for (const kit of KITS) {
    await prisma.kit.upsert({ where: { nombre: kit.nombre }, update: {}, create: { ...kit, enCondiciones: true } });
  }

  console.log(`Listo: ${ROLES.length} roles, ${TRABAJADORES.length} trabajadores (disponibles en diciembre 2026) y ${KITS.length} kits.`);
}

cargar()
  .catch((error) => {
    console.error("No se pudieron cargar los datos de prueba:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
