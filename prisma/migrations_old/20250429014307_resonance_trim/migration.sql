/*
  Warnings:

  - You are about to drop the column `audioPath` on the `Resonance` table. All the data in the column will be lost.
  - You are about to drop the column `chapterData` on the `Resonance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Resonance` DROP COLUMN `audioPath`,
    DROP COLUMN `chapterData`,
    ADD COLUMN `creativityRate` INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN `imageMask` INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `iteration` INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN `seedText` VARCHAR(191) NULL,
    ADD COLUMN `useMicrophone` BOOLEAN NOT NULL DEFAULT false;
