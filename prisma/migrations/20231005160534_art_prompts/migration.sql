/*
  Warnings:

  - You are about to drop the column `characterLimit` on the `Pitch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ArtPrompt` ADD COLUMN `pitchId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `characterLimit`,
    ADD COLUMN `creatorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ArtPrompt` ADD CONSTRAINT `ArtPrompt_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
