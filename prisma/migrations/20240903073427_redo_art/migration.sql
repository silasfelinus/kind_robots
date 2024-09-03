/*
  Warnings:

  - You are about to drop the column `pitch` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `creator` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `creator` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `pitch` on the `Prompt` table. All the data in the column will be lost.
  - You are about to alter the column `prompt` on the `Prompt` table. The data in that column could be lost. The data in that column will be cast from `VarChar(8000)` to `VarChar(764)`.
  - You are about to drop the `_ArtToGallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ArtToGallery` DROP FOREIGN KEY `_ArtToGallery_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToGallery` DROP FOREIGN KEY `_ArtToGallery_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToUser` DROP FOREIGN KEY `_ArtToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToUser` DROP FOREIGN KEY `_ArtToUser_B_fkey`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `pitch`,
    MODIFY `path` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Game` DROP COLUMN `creator`,
    ADD COLUMN `designer` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `creator`,
    ADD COLUMN `designer` VARCHAR(256) NULL;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `pitch`,
    MODIFY `prompt` VARCHAR(764) NOT NULL;

-- DropTable
DROP TABLE `_ArtToGallery`;

-- DropTable
DROP TABLE `_ArtToUser`;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
