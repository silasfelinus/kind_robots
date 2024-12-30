-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `chatExchangeId` INTEGER NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_chatExchangeId_fkey` FOREIGN KEY (`chatExchangeId`) REFERENCES `ChatExchange`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
