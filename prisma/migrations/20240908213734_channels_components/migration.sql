-- AlterTable
ALTER TABLE `Component` ADD COLUMN `channelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Component` ADD CONSTRAINT `Component_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
