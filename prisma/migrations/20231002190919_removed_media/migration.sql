/*
  Warnings:

  - You are about to drop the column `designer` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Model` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ArtPrompt` DROP FOREIGN KEY `ArtPrompt_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Model` DROP FOREIGN KEY `Model_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_userId_fkey`;

-- AlterTable
ALTER TABLE `Pitch` ADD COLUMN `isOrphan` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `designer`;

-- DropTable
DROP TABLE `Media`;

-- DropTable
DROP TABLE `Model`;

-- DropTable
DROP TABLE `Reaction`;
