/*
  Warnings:

  - You are about to drop the column `initialPrompt` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `initialPrompt`,
    ADD COLUMN `prompt` VARCHAR(191) NULL DEFAULT 'Arm butterflies with mini-flamethrowers to kick mosquitos butts';
