-- DropIndex
DROP INDEX `ArtPrompt_galleryId_fkey` ON `ArtPrompt`;

-- AlterTable
ALTER TABLE `Art` ADD COLUMN `channelId` INTEGER NULL,
    ADD COLUMN `isNsfw` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `isOrphan` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
