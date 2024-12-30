-- AlterTable
ALTER TABLE `Art` ADD COLUMN `channelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
