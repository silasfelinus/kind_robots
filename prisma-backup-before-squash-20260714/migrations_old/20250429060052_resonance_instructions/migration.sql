/*
  Warnings:

  - You are about to drop the column `instruction` on the `Resonance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Resonance` DROP COLUMN `instruction`,
    ADD COLUMN `instructions` VARCHAR(512) NULL;
