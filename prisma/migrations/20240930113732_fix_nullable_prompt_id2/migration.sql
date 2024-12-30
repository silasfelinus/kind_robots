-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_promptId_fkey`;

-- AlterTable to make promptId nullable
ALTER TABLE `ChatExchange` MODIFY COLUMN `promptId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
