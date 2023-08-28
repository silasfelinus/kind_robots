/*
  Warnings:

  - You are about to drop the column `BotType` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `training` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `designerId` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `dislikes` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `hasPaywall` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfHighlights` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `usdPrice` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `designerId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `dislikes` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `exifId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `promptId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `promptId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `designId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `designerId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `hasHistory` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `isNSFW` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `designId` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `hash` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `sfwName` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `uploaderId` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `Discord` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `designerName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `facebook` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hashType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kindrobots` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `loginName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferredName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ChatSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Design` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BotToGallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BotToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BotToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DesignToGallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DesignToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DesignToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GalleryToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GalleryToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToResource` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `Bot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `ExifData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Gallery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Prompt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Quest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `description` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `avatarImage` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `theme` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isPublic` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `modules` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `personality` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prompt` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtitle` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `botIntro` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userIntro` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `underConstruction` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tags` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Prompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `avatarImage` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isPrivate` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `allowCookies` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `defaultTheme` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hideBio` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `likes` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showNsfw` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `themeOverride` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `visits` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hideComments` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_designerId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_exifId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_designId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_designerId_fkey`;

-- DropForeignKey
ALTER TABLE `Quest` DROP FOREIGN KEY `Quest_imageId_fkey`;

-- DropForeignKey
ALTER TABLE `Resource` DROP FOREIGN KEY `Resource_designId_fkey`;

-- DropForeignKey
ALTER TABLE `Resource` DROP FOREIGN KEY `Resource_uploaderId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_botId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_designId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_imageId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_resourceId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `UserReview_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToGallery` DROP FOREIGN KEY `_BotToGallery_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToGallery` DROP FOREIGN KEY `_BotToGallery_B_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToImage` DROP FOREIGN KEY `_BotToImage_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToImage` DROP FOREIGN KEY `_BotToImage_B_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToUser` DROP FOREIGN KEY `_BotToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToUser` DROP FOREIGN KEY `_BotToUser_B_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToGallery` DROP FOREIGN KEY `_DesignToGallery_A_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToGallery` DROP FOREIGN KEY `_DesignToGallery_B_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToImage` DROP FOREIGN KEY `_DesignToImage_A_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToImage` DROP FOREIGN KEY `_DesignToImage_B_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToUser` DROP FOREIGN KEY `_DesignToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_DesignToUser` DROP FOREIGN KEY `_DesignToUser_B_fkey`;

-- DropForeignKey
ALTER TABLE `_GalleryToImage` DROP FOREIGN KEY `_GalleryToImage_A_fkey`;

-- DropForeignKey
ALTER TABLE `_GalleryToImage` DROP FOREIGN KEY `_GalleryToImage_B_fkey`;

-- DropForeignKey
ALTER TABLE `_GalleryToUser` DROP FOREIGN KEY `_GalleryToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_GalleryToUser` DROP FOREIGN KEY `_GalleryToUser_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ImageToResource` DROP FOREIGN KEY `_ImageToResource_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ImageToResource` DROP FOREIGN KEY `_ImageToResource_B_fkey`;

-- DropIndex
DROP INDEX `Gallery_designerId_fkey` ON `Gallery`;

-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- DropIndex
DROP INDEX `User_loginName_key` ON `User`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `BotType`,
    DROP COLUMN `training`,
    ADD COLUMN `botType` VARCHAR(191) NOT NULL DEFAULT 'chatbot',
    ADD COLUMN `canDelete` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `trainingPath` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD COLUMN `userId` INTEGER NULL,
    MODIFY `description` VARCHAR(191) NOT NULL DEFAULT 'I''m a kind robot',
    MODIFY `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/wonderchest/wonderchest304_(23).webp',
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `theme` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `isPublic` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `modules` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `personality` VARCHAR(191) NOT NULL DEFAULT 'helpful, inquisitive, considerate',
    MODIFY `prompt` VARCHAR(191) NOT NULL DEFAULT 'Arm butterflies with mini-flamethrowers to kick mosquitos butts',
    MODIFY `subtitle` VARCHAR(191) NOT NULL DEFAULT 'Kind Robot',
    MODIFY `botIntro` VARCHAR(191) NOT NULL DEFAULT 'You''re a Kind Robot',
    MODIFY `userIntro` VARCHAR(191) NOT NULL DEFAULT 'Let''s make a difference. Here''s my idea:',
    MODIFY `underConstruction` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `content`,
    DROP COLUMN `designerId`,
    DROP COLUMN `dislikes`,
    DROP COLUMN `hasPaywall`,
    DROP COLUMN `isPublic`,
    DROP COLUMN `likes`,
    DROP COLUMN `numberOfHighlights`,
    DROP COLUMN `usdPrice`,
    ADD COLUMN `custodian` VARCHAR(191) NULL,
    ADD COLUMN `promoImages` VARCHAR(191) NULL,
    ADD COLUMN `url` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NULL,
    MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Image` DROP COLUMN `designerId`,
    DROP COLUMN `dislikes`,
    DROP COLUMN `exifId`,
    DROP COLUMN `likes`,
    DROP COLUMN `promptId`,
    ADD COLUMN `botId` INTEGER NULL,
    ADD COLUMN `designer` VARCHAR(191) NULL,
    ADD COLUMN `exifDataId` INTEGER NULL,
    ADD COLUMN `galleryId` INTEGER NULL,
    ADD COLUMN `tags` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `promptId`,
    ADD COLUMN `recipient` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'MODEL', 'PAYWALL', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER', 'VIBE') NOT NULL,
    ADD COLUMN `recipientId` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `designId`,
    DROP COLUMN `designerId`,
    DROP COLUMN `hasHistory`,
    DROP COLUMN `isNSFW`,
    DROP COLUMN `isPublic`,
    DROP COLUMN `role`,
    ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'user',
    ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT 'message',
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Quest` DROP COLUMN `imageId`;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `designId`,
    DROP COLUMN `hash`,
    DROP COLUMN `sfwName`,
    DROP COLUMN `uploaderId`,
    ADD COLUMN `customLabel` VARCHAR(191) NULL,
    ADD COLUMN `customUrl` VARCHAR(191) NULL,
    ADD COLUMN `imagePath` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NULL,
    ALTER COLUMN `name` DROP DEFAULT,
    MODIFY `resourceType` ENUM('CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'CONTROLNET', 'URL') NOT NULL DEFAULT 'CHECKPOINT';

-- AlterTable
ALTER TABLE `User` DROP COLUMN `Discord`,
    DROP COLUMN `designerName`,
    DROP COLUMN `facebook`,
    DROP COLUMN `hashType`,
    DROP COLUMN `instagram`,
    DROP COLUMN `kindrobots`,
    DROP COLUMN `loginName`,
    DROP COLUMN `preferredName`,
    DROP COLUMN `twitter`,
    ADD COLUMN `discordUrl` VARCHAR(191) NULL,
    ADD COLUMN `facebookUrl` VARCHAR(191) NULL,
    ADD COLUMN `humanName` VARCHAR(191) NULL,
    ADD COLUMN `instagramUrl` VARCHAR(191) NULL,
    ADD COLUMN `kindrobotsUrl` VARCHAR(191) NULL,
    ADD COLUMN `languages` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `publicName` VARCHAR(191) NOT NULL,
    ADD COLUMN `questPoints` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `salt` VARCHAR(191) NULL,
    ADD COLUMN `twitterUrl` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    MODIFY `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/botcafe.png',
    MODIFY `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `allowCookies` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `defaultTheme` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `hideBio` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `likes` INTEGER NOT NULL DEFAULT 0,
    MODIFY `showNsfw` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `themeOverride` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `visits` INTEGER NOT NULL DEFAULT 0,
    MODIFY `hideComments` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `ChatSettings`;

-- DropTable
DROP TABLE `Design`;

-- DropTable
DROP TABLE `Product`;

-- DropTable
DROP TABLE `UserReview`;

-- DropTable
DROP TABLE `_BotToGallery`;

-- DropTable
DROP TABLE `_BotToImage`;

-- DropTable
DROP TABLE `_BotToUser`;

-- DropTable
DROP TABLE `_DesignToGallery`;

-- DropTable
DROP TABLE `_DesignToImage`;

-- DropTable
DROP TABLE `_DesignToUser`;

-- DropTable
DROP TABLE `_GalleryToImage`;

-- DropTable
DROP TABLE `_GalleryToUser`;

-- DropTable
DROP TABLE `_ImageToResource`;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewTitle` VARCHAR(191) NULL,
    `modelType` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'MODEL', 'PAYWALL', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER', 'VIBE') NOT NULL,
    `modelId` INTEGER NOT NULL,
    `content` VARCHAR(191) NULL,
    `rating` INTEGER NULL,

    UNIQUE INDEX `Reaction_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT 'Here''s the idea...',
    `allowComments` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `hasAdmission` BOOLEAN NOT NULL DEFAULT false,
    `paywallDestination` VARCHAR(191) NULL,
    `hostId` INTEGER NOT NULL,
    `usdFee` DOUBLE NOT NULL,
    `portalUrl` VARCHAR(191) NULL,
    `pitchUrl` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Project_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Bot_id_key` ON `Bot`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `ExifData_id_key` ON `ExifData`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Gallery_id_key` ON `Gallery`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Image_id_key` ON `Image`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Message_id_key` ON `Message`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Prompt_id_key` ON `Prompt`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Quest_id_key` ON `Quest`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Resource_id_key` ON `Resource`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Resource_name_key` ON `Resource`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `User_id_key` ON `User`(`id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_exifDataId_fkey` FOREIGN KEY (`exifDataId`) REFERENCES `ExifData`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
