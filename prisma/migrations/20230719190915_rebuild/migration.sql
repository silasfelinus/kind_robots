/*
  Warnings:

  - You are about to drop the `Checkpoint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Embedding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Conversation` DROP FOREIGN KEY `Conversation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropTable
DROP TABLE `Checkpoint`;

-- DropTable
DROP TABLE `Conversation`;

-- DropTable
DROP TABLE `Embedding`;

-- DropTable
DROP TABLE `Message`;

-- CreateTable
CREATE TABLE `Modeller` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `hash` VARCHAR(191) NULL,
    `sfwName` VARCHAR(191) NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `civitaiUrl` VARCHAR(191) NULL,
    `huggingUrl` VARCHAR(191) NULL,
    `content` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'checkpoint',
    `image1` VARCHAR(191) NULL,
    `image2` VARCHAR(191) NULL,
    `image3` VARCHAR(191) NULL,
    `user` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `prompts` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
