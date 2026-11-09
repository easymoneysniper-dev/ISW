/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `trabajadores` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "email" VARCHAR(254);

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_email_key" ON "trabajadores"("email");
