/*
  Warnings:

  - You are about to drop the `_BotToPrompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_BotToPrompt` DROP FOREIGN KEY `_BotToPrompt_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToPrompt` DROP FOREIGN KEY `_BotToPrompt_B_fkey`;

-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `botId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `rating` INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `_BotToPrompt`;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
