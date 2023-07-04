/*
  Warnings:

  - You are about to drop the column `threadId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conversationId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `threadId`,
    ADD COLUMN `conversationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `isNsfw` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sfwContent` VARCHAR(191) NULL,
    ADD COLUMN `tokenCount` INTEGER NULL;

-- DropTable
DROP TABLE `Resource`;

-- CreateTable
CREATE TABLE `Bot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'chatbot',
    `description` VARCHAR(191) NOT NULL DEFAULT 'I''m a Kind Robot',
    `intro` VARCHAR(191) NOT NULL DEFAULT 'I''m a Kind Robot! What do you want to talk about?',
    `training` VARCHAR(191) NOT NULL DEFAULT 'You are a kind chatbot',
    `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/amibot01.png',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Checkpoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `hash` VARCHAR(191) NOT NULL DEFAULT '',
    `sfwName` VARCHAR(191) NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `civitaiUrl` VARCHAR(191) NULL,
    `huggingUrl` VARCHAR(191) NULL,
    `image1` VARCHAR(191) NULL,
    `image2` VARCHAR(191) NULL,
    `image3` VARCHAR(191) NULL,
    `user` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Embedding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `prompt` VARCHAR(191) NULL,
    `civitaiUrl` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'embedding',
    `image1` VARCHAR(191) NULL,
    `image2` VARCHAR(191) NULL,
    `image3` VARCHAR(191) NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `prompt` VARCHAR(191) NOT NULL DEFAULT '',
    `negative` VARCHAR(191) NOT NULL DEFAULT '',
    `gallery` VARCHAR(191) NULL,
    `steps` INTEGER NULL,
    `sampler` VARCHAR(191) NULL,
    `cfg` VARCHAR(191) NULL,
    `seed` INTEGER NOT NULL,
    `size` VARCHAR(191) NULL,
    `modelHash` VARCHAR(191) NULL,
    `modelName` VARCHAR(191) NULL,
    `template` VARCHAR(191) NULL,
    `negTemplate` VARCHAR(191) NULL,
    `promptId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `creator` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `userID` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
