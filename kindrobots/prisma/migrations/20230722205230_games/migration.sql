/*
  Warnings:

  - You are about to drop the column `avatarImage` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `ExifData` table. All the data in the column will be lost.
  - You are about to drop the column `promoImages` on the `Gallery` table. All the data in the column will be lost.
  - The values [IMAGE_URL] on the enum `Prompt_StringType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMAGE] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMAGE] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMAGE] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `imagePath` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `avatarImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `MediaId` to the `ExifData` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ExifData` DROP FOREIGN KEY `ExifData_imageId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Quest` DROP FOREIGN KEY `Quest_userId_fkey`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `avatarImage`,
    ADD COLUMN `avatarMedia` VARCHAR(191) NOT NULL DEFAULT '/Medias/wonderchest/wonderchest304_(23).webp';

-- AlterTable
ALTER TABLE `ExifData` DROP COLUMN `imageId`,
    ADD COLUMN `MediaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `promoImages`,
    ADD COLUMN `promoMedias` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Prompt` MODIFY `StringType` ENUM('TAG', 'PROMPT', 'WILDCARD', 'RESPONSE', 'Media_URL', 'URL', 'MASK_URL', 'CODE', 'ERROR') NOT NULL,
    MODIFY `recipient` ENUM('BOT', 'GALLERY', 'Media', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    MODIFY `sender` ENUM('BOT', 'GALLERY', 'Media', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `modelType` ENUM('BOT', 'GALLERY', 'Media', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `imagePath`,
    ADD COLUMN `MediaPath` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `avatarImage`,
    ADD COLUMN `avatarMedia` VARCHAR(191) NOT NULL DEFAULT '/Medias/botcafe.png';

-- DropTable
DROP TABLE `Image`;

-- DropTable
DROP TABLE `Quest`;

-- CreateTable
CREATE TABLE `Media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `path` VARCHAR(191) NOT NULL DEFAULT '/',
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `tags` VARCHAR(191) NOT NULL DEFAULT 'AI, Cafe Purr',
    `designer` VARCHAR(191) NULL,
    `exifDataId` INTEGER NULL,
    `userId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `botId` INTEGER NULL,

    UNIQUE INDEX `Media_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Game` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Blue Sky Tasks',
    `isFinished` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `reward` VARCHAR(191) NOT NULL DEFAULT 'A Magic Reward',
    `icon` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 10,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Game_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExifData` ADD CONSTRAINT `ExifData_MediaId_fkey` FOREIGN KEY (`MediaId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
