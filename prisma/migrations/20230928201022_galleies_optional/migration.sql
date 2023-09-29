-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtPrompt` DROP FOREIGN KEY `ArtPrompt_galleryId_fkey`;

-- AlterTable
ALTER TABLE `Art` MODIFY `galleryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ArtPrompt` MODIFY `galleryId` INTEGER NULL DEFAULT 21;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtPrompt` ADD CONSTRAINT `ArtPrompt_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
