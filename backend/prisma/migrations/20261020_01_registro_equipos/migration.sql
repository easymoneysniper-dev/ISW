-- RegistroCambio ya está en schema.prisma (módulo M2), pero no tenía migración.
-- Se conserva la tabla si fue creada previamente; no se alteran sus datos.
CREATE TABLE IF NOT EXISTS "registros_cambio" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "modulo" VARCHAR(20) NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "entidad" VARCHAR(100) NOT NULL,
    "entidadId" INTEGER,
    "detalle" VARCHAR(500),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registros_cambio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "registros_cambio_creadoEn_idx" ON "registros_cambio"("creadoEn");

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('DISPONIBLE', 'DANADO', 'EN_REPARACION', 'PERDIDO', 'DADO_DE_BAJA');

-- CreateTable
CREATE TABLE "kits" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "numeroSerie" VARCHAR(150),
    "precioCompra" DECIMAL(14,0) NOT NULL,
    "fechaCompra" DATE NOT NULL,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'DISPONIBLE',
    "kitId" INTEGER,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kits_nombre_key" ON "kits"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_numeroSerie_key" ON "equipos"("numeroSerie");

-- CreateIndex
CREATE INDEX "equipos_fechaCompra_idx" ON "equipos"("fechaCompra");

-- CreateIndex
CREATE INDEX "equipos_kitId_idx" ON "equipos"("kitId");

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Protección adicional si se escribe fuera de la API.
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_precioCompra_positivo" CHECK ("precioCompra" > 0);
