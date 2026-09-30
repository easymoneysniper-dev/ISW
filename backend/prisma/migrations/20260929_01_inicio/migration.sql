-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoTransmision" AS ENUM ('COTIZADA', 'ACEPTADA', 'CONFIRMADA', 'REALIZADA', 'RENDIDA', 'CERRADA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmisiones" (
    "id" SERIAL NOT NULL,
    "nombreEvento" VARCHAR(200) NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "termino" TIMESTAMPTZ(3) NOT NULL,
    "lugar" VARCHAR(250) NOT NULL,
    "cantidadCamaras" INTEGER NOT NULL,
    "precioCotizado" DECIMAL(14,0) NOT NULL,
    "salidaRegiones" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoTransmision" NOT NULL DEFAULT 'COTIZADA',
    "clienteId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transmisiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transmisiones_inicio_idx" ON "transmisiones"("inicio");

-- CreateIndex
CREATE INDEX "transmisiones_clienteId_idx" ON "transmisiones"("clienteId");

-- AddForeignKey
ALTER TABLE "transmisiones" ADD CONSTRAINT "transmisiones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
