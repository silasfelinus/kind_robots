-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `channelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
