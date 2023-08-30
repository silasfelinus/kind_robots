/*
  Warnings:

  - You are about to drop the column `channel` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `mask` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `highlightImage` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `isAuth` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `cfg` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `creator` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `creatorID` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `gallery` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `galleryId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `modelHash` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `modelName` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `negTemplate` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `negative` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `sampler` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `seed` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `steps` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `bot` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `realName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `useCookies` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Modeller` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wildcard` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `designerId` to the `Bot` table without a default value. This is not possible if the table is not empty.
  - Made the column `avatarImage` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxTokens` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `model` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `post` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `temperature` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `n` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intro` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `training` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `theme` on table `Bot` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `designerId` to the `Gallery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `designerId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `designerId` to the `Prompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Prompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hiddenTags` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loginName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `avatarImage` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bio` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Response` DROP FOREIGN KEY `Response_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Todo` DROP FOREIGN KEY `Todo_userId_fkey`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `channel`,
    DROP COLUMN `image`,
    DROP COLUMN `mask`,
    DROP COLUMN `prompt`,
    DROP COLUMN `size`,
    DROP COLUMN `style`,
    DROP COLUMN `userId`,
    ADD COLUMN `avatarImageId` INTEGER NULL,
    ADD COLUMN `defaultPrompt` VARCHAR(191) NOT NULL DEFAULT 'Arm butterflies with mini-flamethrowers',
    ADD COLUMN `designerId` INTEGER NOT NULL,
    ADD COLUMN `dislikes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `embedding` VARCHAR(191) NULL,
    ADD COLUMN `imageGalleryId` INTEGER NULL,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isUnderConstruction` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0,
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT 'Newb0t',
    MODIFY `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/wonderchest/wonderchest304_(23).webp',
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `maxTokens` INTEGER NOT NULL DEFAULT 500,
    MODIFY `model` VARCHAR(191) NOT NULL DEFAULT 'gpt-3.5-turbo',
    MODIFY `post` VARCHAR(191) NOT NULL DEFAULT 'https://api.openai.com/v1/completions',
    MODIFY `temperature` DOUBLE NOT NULL DEFAULT 1.0,
    MODIFY `n` INTEGER NOT NULL DEFAULT 1,
    MODIFY `intro` VARCHAR(191) NOT NULL DEFAULT 'Let''s make a difference. Here''s my idea:',
    MODIFY `training` VARCHAR(191) NOT NULL DEFAULT '[{role=''SYSTEM'', content=''You are a robot. You just came alive.''}]',
    MODIFY `theme` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `channel`,
    DROP COLUMN `highlightImage`,
    DROP COLUMN `isAuth`,
    DROP COLUMN `user`,
    DROP COLUMN `userId`,
    ADD COLUMN `designId` INTEGER NULL,
    ADD COLUMN `designerId` INTEGER NOT NULL,
    ADD COLUMN `dislikes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hasPaywall` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `numberOfHighlights` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `usdPrice` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Image` DROP COLUMN `cfg`,
    DROP COLUMN `creator`,
    DROP COLUMN `creatorID`,
    DROP COLUMN `description`,
    DROP COLUMN `gallery`,
    DROP COLUMN `galleryId`,
    DROP COLUMN `modelHash`,
    DROP COLUMN `modelName`,
    DROP COLUMN `negTemplate`,
    DROP COLUMN `negative`,
    DROP COLUMN `prompt`,
    DROP COLUMN `sampler`,
    DROP COLUMN `seed`,
    DROP COLUMN `size`,
    DROP COLUMN `steps`,
    DROP COLUMN `template`,
    DROP COLUMN `userId`,
    ADD COLUMN `designerId` INTEGER NOT NULL,
    ADD COLUMN `dislikes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `exifId` INTEGER NULL,
    ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0,
    MODIFY `path` VARCHAR(191) NOT NULL DEFAULT '/';

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `bot`,
    DROP COLUMN `user`,
    DROP COLUMN `userId`,
    ADD COLUMN `designId` INTEGER NULL,
    ADD COLUMN `designerId` INTEGER NOT NULL,
    ADD COLUMN `dislikes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER') NOT NULL,
    ALTER COLUMN `content` DROP DEFAULT;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `realName`,
    DROP COLUMN `role`,
    DROP COLUMN `theme`,
    DROP COLUMN `useCookies`,
    DROP COLUMN `userName`,
    ADD COLUMN `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER') NOT NULL DEFAULT 'USER',
    ADD COLUMN `allowCookies` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `defaultTheme` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD COLUMN `designerName` VARCHAR(191) NOT NULL DEFAULT 'Kind Designer',
    ADD COLUMN `hiddenTags` VARCHAR(191) NOT NULL,
    ADD COLUMN `hideBio` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `loginName` VARCHAR(191) NOT NULL,
    ADD COLUMN `preferredName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `showNsfw` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `themeOverride` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `visits` INTEGER NOT NULL DEFAULT 0,
    MODIFY `avatarImage` VARCHAR(191) NOT NULL,
    MODIFY `bio` VARCHAR(191) NOT NULL DEFAULT 'I was born and then things happened and now I''m here.';

-- DropTable
DROP TABLE `Modeller`;

-- DropTable
DROP TABLE `Response`;

-- DropTable
DROP TABLE `Tag`;

-- DropTable
DROP TABLE `Todo`;

-- DropTable
DROP TABLE `Wildcard`;

-- CreateTable
CREATE TABLE `Design` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `designType` ENUM('WILDCARD', 'PRODUCT', 'SPONSOR', 'WEBAPP', 'QUESTCHAIN', 'DATA') NOT NULL DEFAULT 'WILDCARD',
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT 'My idea is',
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `designerId` INTEGER NOT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'default',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDesignFan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `designId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExifData` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `negative` VARCHAR(191) NULL,
    `steps` INTEGER NULL,
    `seed` INTEGER NULL,
    `sampler` VARCHAR(191) NULL,
    `cfg` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `modelHash` VARCHAR(191) NULL,
    `modelName` VARCHAR(191) NULL,
    `template` VARCHAR(191) NULL,
    `negTemplate` VARCHAR(191) NULL,
    `clip` VARCHAR(191) NULL,
    `deepboro` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Blue Sky Tasks',
    `isFinished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `reward` VARCHAR(191) NOT NULL DEFAULT 'A Magic Reward',
    `icon` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 10,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `hash` VARCHAR(191) NULL,
    `sfwName` VARCHAR(191) NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `civitaiUrl` VARCHAR(191) NULL,
    `huggingUrl` VARCHAR(191) NULL,
    `localPath` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `resourceType` ENUM('CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'CONTROLNET') NOT NULL DEFAULT 'CHECKPOINT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `uploaderId` INTEGER NOT NULL,
    `designId` INTEGER NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BotToPrompt` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToPrompt_AB_unique`(`A`, `B`),
    INDEX `_BotToPrompt_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DesignToImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DesignToImage_AB_unique`(`A`, `B`),
    INDEX `_DesignToImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GalleryToImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GalleryToImage_AB_unique`(`A`, `B`),
    INDEX `_GalleryToImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ImageToResource` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ImageToResource_AB_unique`(`A`, `B`),
    INDEX `_ImageToResource_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_imageGalleryId_fkey` FOREIGN KEY (`imageGalleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_avatarImageId_fkey` FOREIGN KEY (`avatarImageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Design` ADD CONSTRAINT `Design_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDesignFan` ADD CONSTRAINT `UserDesignFan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDesignFan` ADD CONSTRAINT `UserDesignFan_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `Design`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `Design`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_exifId_fkey` FOREIGN KEY (`exifId`) REFERENCES `ExifData`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `Design`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quest` ADD CONSTRAINT `Quest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `Design`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToPrompt` ADD CONSTRAINT `_BotToPrompt_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToPrompt` ADD CONSTRAINT `_BotToPrompt_B_fkey` FOREIGN KEY (`B`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DesignToImage` ADD CONSTRAINT `_DesignToImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `Design`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DesignToImage` ADD CONSTRAINT `_DesignToImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GalleryToImage` ADD CONSTRAINT `_GalleryToImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `Gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GalleryToImage` ADD CONSTRAINT `_GalleryToImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ImageToResource` ADD CONSTRAINT `_ImageToResource_A_fkey` FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ImageToResource` ADD CONSTRAINT `_ImageToResource_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
