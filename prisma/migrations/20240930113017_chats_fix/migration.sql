/*
  Warnings:

  - Made the column `promptId` on table `ChatExchange` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_promptId_fkey`;

-- AlterTable
ALTER TABLE `ChatExchange` MODIFY `promptId` INTEGER;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
