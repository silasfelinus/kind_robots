-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_botId_fkey`;

-- AlterTable
ALTER TABLE `ChatExchange` ADD COLUMN `previousEntryId` INTEGER NULL DEFAULT 0,
    MODIFY `botId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
