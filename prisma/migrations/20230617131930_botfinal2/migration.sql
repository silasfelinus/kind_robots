/*
  Warnings:

  - You are about to drop the column `nVariations` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `nVariations`,
    ADD COLUMN `n` INTEGER NOT NULL DEFAULT 1;
