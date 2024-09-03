/*
  Warnings:

  - You are about to drop the column `artPromptId` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the `ArtPrompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Slogan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtPromptToGame` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SloganToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ArtPrompt` DROP FOREIGN KEY `ArtPrompt_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `Slogan` DROP FOREIGN KEY `Slogan_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Slogan` DROP FOREIGN KEY `Slogan_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtPromptToGame` DROP FOREIGN KEY `_ArtPromptToGame_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtPromptToGame` DROP FOREIGN KEY `_ArtPromptToGame_B_fkey`;

-- DropForeignKey
ALTER TABLE `_SloganToTag` DROP FOREIGN KEY `_SloganToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_SloganToTag` DROP FOREIGN KEY `_SloganToTag_B_fkey`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `artPromptId`,
    ADD COLUMN `promptId` INTEGER NULL;

-- DropTable
DROP TABLE `ArtPrompt`;

-- DropTable
DROP TABLE `Slogan`;

-- DropTable
DROP TABLE `_ArtPromptToGame`;

-- DropTable
DROP TABLE `_SloganToTag`;

-- CreateTable
CREATE TABLE `Prompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL DEFAULT 0,
    `prompt` VARCHAR(8000) NOT NULL,
    `galleryId` INTEGER NULL DEFAULT 0,
    `pitch` VARCHAR(764) NULL,
    `pitchId` INTEGER NULL DEFAULT 0,
    `playerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GameToPrompt` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GameToPrompt_AB_unique`(`A`, `B`),
    INDEX `_GameToPrompt_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GameToPrompt` ADD CONSTRAINT `_GameToPrompt_A_fkey` FOREIGN KEY (`A`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GameToPrompt` ADD CONSTRAINT `_GameToPrompt_B_fkey` FOREIGN KEY (`B`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
