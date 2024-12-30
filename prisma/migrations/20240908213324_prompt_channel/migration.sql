-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `channelId` INTEGER NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
