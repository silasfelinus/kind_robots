/*
  Warnings:

  - You are about to drop the `ChatExchange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RandomList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PostToTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[chatId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_chatExchangeId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_postId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_botId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatExchange` DROP FOREIGN KEY `ChatExchange_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `RandomList` DROP FOREIGN KEY `RandomList_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_chatExchangeId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_postId_fkey`;

-- DropForeignKey
ALTER TABLE `_PostToTag` DROP FOREIGN KEY `_PostToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_PostToTag` DROP FOREIGN KEY `_PostToTag_B_fkey`;

-- DropIndex
DROP INDEX `Pitch_pitch_key` ON `Pitch`;

-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `chatId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pitch` ADD COLUMN `examples` LONGTEXT NULL,
    MODIFY `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'BOT', 'ARTGALLERY', 'INSPIRATION', 'RANDOMLIST', 'TEXTPITCH') NOT NULL DEFAULT 'ARTPITCH';

-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `chatId` INTEGER NULL;

-- DropTable
DROP TABLE `ChatExchange`;

-- DropTable
DROP TABLE `Message`;

-- DropTable
DROP TABLE `Post`;

-- DropTable
DROP TABLE `RandomList`;

-- DropTable
DROP TABLE `_PostToTag`;

-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser') NOT NULL,
    `sender` VARCHAR(255) NOT NULL,
    `recipient` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `title` VARCHAR(255) NULL,
    `label` VARCHAR(255) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `previousEntryId` INTEGER NULL,
    `originId` INTEGER NULL,
    `userId` INTEGER NULL,
    `botId` INTEGER NULL,
    `recipientId` INTEGER NULL,
    `channelId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `botName` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_chatId_key` ON `ArtImage`(`chatId`);

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
