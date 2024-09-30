/*
  Warnings:

  - You are about to drop the column `botId` on the `Prompt` table. All the data in the column will be lost.
  - Added the required column `promptId` to the `ChatExchange` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_botId_fkey`;

-- AlterTable
ALTER TABLE `ChatExchange` ADD COLUMN `promptId` INTEGER;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `botId`;

-- CreateTable
CREATE TABLE `_BotToPrompt` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToPrompt_AB_unique`(`A`, `B`),
    INDEX `_BotToPrompt_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToPrompt` ADD CONSTRAINT `_BotToPrompt_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToPrompt` ADD CONSTRAINT `_BotToPrompt_B_fkey` FOREIGN KEY (`B`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
