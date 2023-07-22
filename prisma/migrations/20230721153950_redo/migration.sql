/*
  Warnings:

  - You are about to drop the column `avatarImageId` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `imageGalleryId` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `n` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `post` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `Bot` table. All the data in the column will be lost.
  - You are about to alter the column `BotType` on the `Bot` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `VarChar(191)`.
  - You are about to drop the column `temperature` on the `BotSimple` table. All the data in the column will be lost.
  - You are about to alter the column `BotType` on the `BotSimple` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to drop the `_BotToPrompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_avatarImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_imageGalleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_resourceId_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToPrompt` DROP FOREIGN KEY `_BotToPrompt_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToPrompt` DROP FOREIGN KEY `_BotToPrompt_B_fkey`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `avatarImageId`,
    DROP COLUMN `imageGalleryId`,
    DROP COLUMN `maxTokens`,
    DROP COLUMN `model`,
    DROP COLUMN `n`,
    DROP COLUMN `post`,
    DROP COLUMN `resourceId`,
    DROP COLUMN `temperature`,
    MODIFY `BotType` VARCHAR(191) NOT NULL DEFAULT 'chatbot';

-- AlterTable
ALTER TABLE `BotSimple` DROP COLUMN `temperature`,
    MODIFY `BotType` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_BotToPrompt`;

-- CreateTable
CREATE TABLE `ChatSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `title` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL DEFAULT 'gpt-3.5-turbo',
    `post` VARCHAR(191) NULL DEFAULT 'https://api.openai.com/v1/completions',
    `temperature` DOUBLE NULL DEFAULT 1.0,
    `maxTokens` INTEGER NULL DEFAULT 500,
    `n` INTEGER NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BotToGallery` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToGallery_AB_unique`(`A`, `B`),
    INDEX `_BotToGallery_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BotToImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToImage_AB_unique`(`A`, `B`),
    INDEX `_BotToImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_BotToGallery` ADD CONSTRAINT `_BotToGallery_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToGallery` ADD CONSTRAINT `_BotToGallery_B_fkey` FOREIGN KEY (`B`) REFERENCES `Gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToImage` ADD CONSTRAINT `_BotToImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToImage` ADD CONSTRAINT `_BotToImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
