/*
  Warnings:

  - You are about to drop the `Butterfly` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ButterflyRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ButterflyRecord` DROP FOREIGN KEY `ButterflyRecord_butterflyId_fkey`;

-- DropForeignKey
ALTER TABLE `ButterflyRecord` DROP FOREIGN KEY `ButterflyRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_butterflyId_fkey`;

-- DropTable
DROP TABLE `Butterfly`;

-- DropTable
DROP TABLE `ButterflyRecord`;
