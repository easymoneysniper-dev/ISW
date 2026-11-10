/*
  Warnings:

  - You are about to drop the column `salidaRegiones` on the `transmisiones` table. All the data in the column will be lost.
  - Added the required column `precioBase` to the `transmisiones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Zona" AS ENUM ('LOCAL', 'REGIONES');

-- CreateEnum
CREATE TYPE "DecisionAdelanto" AS ENUM ('RETENER', 'DEVOLVER');

-- CreateEnum
CREATE TYPE "EstadoAsignacion" AS ENUM ('ASIGNADO', 'REEMPLAZADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "Asistencia" AS ENUM ('PENDIENTE', 'ASISTIO', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "CategoriaKit" AS ENUM ('NUEVO', 'INTERMEDIO', 'ANTIGUO');

-- CreateEnum
CREATE TYPE "TipoEquipo" AS ENUM ('CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoRetorno" AS ENUM ('BUEN_ESTADO', 'DANADO', 'NO_DEVUELTO');

-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('DANO', 'PERDIDA', 'ROBO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ADELANTO', 'SALDO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('TRANSFERENCIA', 'EFECTIVO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('MOVILIZACION', 'PEAJE', 'ALIMENTACION', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoAporte" AS ENUM ('DINERO', 'CANJE');

-- CreateEnum
CREATE TYPE "EstadoAporte" AS ENUM ('COMPROMETIDO', 'CUMPLIDO', 'NO_CUMPLIDO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "email" VARCHAR(254),
ADD COLUMN     "telefono" VARCHAR(30);

-- AlterTable
ALTER TABLE "equipos" ADD COLUMN     "fechaBaja" DATE,
ADD COLUMN     "tipo" "TipoEquipo" NOT NULL DEFAULT 'OTRO';

-- AlterTable
ALTER TABLE "kits" ADD COLUMN     "categoria" "CategoriaKit" NOT NULL DEFAULT 'ANTIGUO',
ADD COLUMN     "enCondiciones" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transmisiones" DROP COLUMN "salidaRegiones",
ADD COLUMN     "ajuste" DECIMAL(14,0) NOT NULL DEFAULT 0,
ADD COLUMN     "camarasUtilizadas" INTEGER,
ADD COLUMN     "decisionAdelanto" "DecisionAdelanto",
ADD COLUMN     "fechaRendicion" TIMESTAMPTZ(3),
ADD COLUMN     "motivoCancelacion" VARCHAR(500),
ADD COLUMN     "precioBase" DECIMAL(14,0) NOT NULL,
ADD COLUMN     "requiereAdelanto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiempoTrasladoMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zona" "Zona" NOT NULL DEFAULT 'LOCAL';

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" SERIAL NOT NULL,
    "rut" VARCHAR(12) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(30) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_tecnicos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajador_roles" (
    "trabajadorId" INTEGER NOT NULL,
    "rolTecnicoId" INTEGER NOT NULL,

    CONSTRAINT "trabajador_roles_pkey" PRIMARY KEY ("trabajadorId","rolTecnicoId")
);

-- CreateTable
CREATE TABLE "disponibilidades" (
    "id" SERIAL NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "termino" TIMESTAMPTZ(3) NOT NULL,
    "trabajadorId" INTEGER NOT NULL,

    CONSTRAINT "disponibilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" SERIAL NOT NULL,
    "porcentajeComision" DECIMAL(5,2),
    "estado" "EstadoAsignacion" NOT NULL DEFAULT 'ASIGNADO',
    "motivo" VARCHAR(300),
    "asistencia" "Asistencia" NOT NULL DEFAULT 'PENDIENTE',
    "fechaLiquidacion" DATE,
    "transmisionId" INTEGER NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "reemplazaAId" INTEGER,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion_roles" (
    "asignacionId" INTEGER NOT NULL,
    "rolTecnicoId" INTEGER NOT NULL,

    CONSTRAINT "asignacion_roles_pkey" PRIMARY KEY ("asignacionId","rolTecnicoId")
);

-- CreateTable
CREATE TABLE "transmision_kits" (
    "transmisionId" INTEGER NOT NULL,
    "kitId" INTEGER NOT NULL,
    "recargoAplicado" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "transmision_kits_pkey" PRIMARY KEY ("transmisionId","kitId")
);

-- CreateTable
CREATE TABLE "salidas_equipo" (
    "id" SERIAL NOT NULL,
    "fechaSalida" TIMESTAMPTZ(3) NOT NULL,
    "fechaRetorno" TIMESTAMPTZ(3),
    "estadoRetorno" "EstadoRetorno",
    "transmisionId" INTEGER NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,

    CONSTRAINT "salidas_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidentes" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoIncidente" NOT NULL,
    "observacion" VARCHAR(500) NOT NULL,
    "fecha" DATE NOT NULL,
    "salidaId" INTEGER NOT NULL,

    CONSTRAINT "incidentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "monto" DECIMAL(14,0) NOT NULL,
    "fecha" DATE NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "comprobanteArchivo" VARCHAR(300) NOT NULL,
    "transmisionId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(14,0) NOT NULL,
    "fecha" DATE NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "comprobanteArchivo" VARCHAR(300) NOT NULL,
    "pagoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "monto" DECIMAL(14,0) NOT NULL,
    "fecha" DATE NOT NULL,
    "observacion" VARCHAR(500),
    "comprobanteArchivo" VARCHAR(300) NOT NULL,
    "origen" VARCHAR(250),
    "destino" VARCHAR(250),
    "transmisionId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costos_fijos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "monto" DECIMAL(14,0) NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "costos_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auspiciadores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "contacto" VARCHAR(150) NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auspiciadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoAporte" NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "valorPesos" DECIMAL(14,0),
    "fechaComprometida" DATE NOT NULL,
    "estado" "EstadoAporte" NOT NULL DEFAULT 'COMPROMETIDO',
    "fechaRecepcion" DATE,
    "comprobanteArchivo" VARCHAR(300),
    "observacion" VARCHAR(500),
    "auspiciadorId" INTEGER NOT NULL,
    "transmisionId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "aportes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_rut_key" ON "trabajadores"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tecnicos_nombre_key" ON "roles_tecnicos"("nombre");

-- CreateIndex
CREATE INDEX "disponibilidades_trabajadorId_inicio_idx" ON "disponibilidades"("trabajadorId", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_reemplazaAId_key" ON "asignaciones"("reemplazaAId");

-- CreateIndex
CREATE INDEX "asignaciones_transmisionId_idx" ON "asignaciones"("transmisionId");

-- CreateIndex
CREATE INDEX "asignaciones_trabajadorId_idx" ON "asignaciones"("trabajadorId");

-- CreateIndex
CREATE INDEX "salidas_equipo_transmisionId_idx" ON "salidas_equipo"("transmisionId");

-- CreateIndex
CREATE INDEX "salidas_equipo_equipoId_idx" ON "salidas_equipo"("equipoId");

-- CreateIndex
CREATE UNIQUE INDEX "incidentes_salidaId_key" ON "incidentes"("salidaId");

-- CreateIndex
CREATE INDEX "pagos_transmisionId_idx" ON "pagos"("transmisionId");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_pagoId_key" ON "devoluciones"("pagoId");

-- CreateIndex
CREATE INDEX "gastos_transmisionId_idx" ON "gastos"("transmisionId");

-- CreateIndex
CREATE UNIQUE INDEX "costos_fijos_nombre_mes_anio_key" ON "costos_fijos"("nombre", "mes", "anio");

-- CreateIndex
CREATE INDEX "aportes_auspiciadorId_idx" ON "aportes"("auspiciadorId");

-- CreateIndex
CREATE INDEX "aportes_transmisionId_idx" ON "aportes"("transmisionId");

-- CreateIndex
CREATE INDEX "registros_cambio_usuarioId_idx" ON "registros_cambio"("usuarioId");

-- CreateIndex
CREATE INDEX "transmisiones_estado_idx" ON "transmisiones"("estado");

-- AddForeignKey
ALTER TABLE "registros_cambio" ADD CONSTRAINT "registros_cambio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_roles" ADD CONSTRAINT "trabajador_roles_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_roles" ADD CONSTRAINT "trabajador_roles_rolTecnicoId_fkey" FOREIGN KEY ("rolTecnicoId") REFERENCES "roles_tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidades" ADD CONSTRAINT "disponibilidades_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_reemplazaAId_fkey" FOREIGN KEY ("reemplazaAId") REFERENCES "asignaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_roles" ADD CONSTRAINT "asignacion_roles_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "asignaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_roles" ADD CONSTRAINT "asignacion_roles_rolTecnicoId_fkey" FOREIGN KEY ("rolTecnicoId") REFERENCES "roles_tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmision_kits" ADD CONSTRAINT "transmision_kits_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmision_kits" ADD CONSTRAINT "transmision_kits_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas_equipo" ADD CONSTRAINT "salidas_equipo_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas_equipo" ADD CONSTRAINT "salidas_equipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas_equipo" ADD CONSTRAINT "salidas_equipo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes" ADD CONSTRAINT "incidentes_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "salidas_equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_auspiciadorId_fkey" FOREIGN KEY ("auspiciadorId") REFERENCES "auspiciadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_transmisionId_fkey" FOREIGN KEY ("transmisionId") REFERENCES "transmisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
