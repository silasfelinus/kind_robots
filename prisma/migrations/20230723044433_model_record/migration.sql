/*
  Warnings:

  - You are about to drop the `Bot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Gallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Game` DROP FOREIGN KEY `Game_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Resource` DROP FOREIGN KEY `Resource_userId_fkey`;

-- DropTable
DROP TABLE `Bot`;

-- DropTable
DROP TABLE `Gallery`;

-- DropTable
DROP TABLE `Game`;

-- DropTable
DROP TABLE `Media`;

-- DropTable
DROP TABLE `Project`;

-- DropTable
DROP TABLE `Prompt`;

-- DropTable
DROP TABLE `Reaction`;

-- DropTable
DROP TABLE `Resource`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `BotRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `BotType` ENUM('PROMPTBOT', 'CHATBOT', 'ARTBOT') NOT NULL DEFAULT 'CHATBOT',
    `name` VARCHAR(191) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `subtitle` VARCHAR(191) NOT NULL DEFAULT 'Kind Robot',
    `description` VARCHAR(191) NOT NULL DEFAULT 'I''m a kind robot',
    `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/wonderchest/wonderchest304_(23).webp',
    `botIntro` VARCHAR(191) NOT NULL DEFAULT 'You''re a Kind Robot',
    `userIntro` VARCHAR(191) NOT NULL DEFAULT 'Let''s make a difference. Here''s my idea:',
    `prompt` VARCHAR(191) NOT NULL DEFAULT 'Arm butterflies with mini-flamethrowers to kick mosquitos butts',
    `trainingPath` VARCHAR(191) NULL,
    `theme` VARCHAR(191) NULL,
    `personality` VARCHAR(191) NOT NULL DEFAULT 'helpful, inquisitive, considerate',
    `modules` VARCHAR(191) NULL,
    `userId` INTEGER NULL,

    UNIQUE INDEX `BotRecord_id_key`(`id`),
    UNIQUE INDEX `BotRecord_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `mediaId` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `custodian` VARCHAR(191) NULL,
    `userId` INTEGER NULL,

    UNIQUE INDEX `GalleryRecord_id_key`(`id`),
    UNIQUE INDEX `GalleryRecord_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaRecord` (
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
    `clipData` VARCHAR(191) NULL,
    `deepboroData` VARCHAR(191) NULL,

    UNIQUE INDEX `MediaRecord_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromptRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `StringType` ENUM('TAG', 'PROMPT', 'WILDCARD', 'RESPONSE', 'MEDIA_URL', 'URL', 'CODE', 'ERROR') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `sender` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    `senderId` INTEGER NULL,
    `recipient` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    `recipientId` INTEGER NULL,

    UNIQUE INDEX `PromptRecord_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER') NOT NULL DEFAULT 'USER',
    `username` VARCHAR(191) NOT NULL,
    `realName` VARCHAR(191) NULL,
    `fancyName` VARCHAR(191) NULL,
    `salt` VARCHAR(191) NULL,
    `hashedPassword` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL DEFAULT 'I was born and then things happened and now I''m here.',
    `birthday` VARCHAR(191) NULL,
    `address1` VARCHAR(191) NULL,
    `address2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `languages` VARCHAR(191) NULL,
    `hideBio` BOOLEAN NOT NULL DEFAULT false,
    `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/botcafe.png',
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `allowCookies` BOOLEAN NOT NULL DEFAULT false,
    `defaultTheme` VARCHAR(191) NOT NULL DEFAULT 'default',
    `themeOverride` BOOLEAN NOT NULL DEFAULT false,
    `showNsfw` BOOLEAN NOT NULL DEFAULT false,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `visits` INTEGER NOT NULL DEFAULT 0,
    `hideComments` BOOLEAN NOT NULL DEFAULT false,
    `instagramUrl` VARCHAR(191) NULL,
    `twitterUrl` VARCHAR(191) NULL,
    `facebookUrl` VARCHAR(191) NULL,
    `discordUrl` VARCHAR(191) NULL,
    `kindrobotsUrl` VARCHAR(191) NULL,
    `hideSocialNetworks` BOOLEAN NOT NULL DEFAULT false,
    `questPoints` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `UserRecord_id_key`(`id`),
    UNIQUE INDEX `UserRecord_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameRecord` (
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

    UNIQUE INDEX `GameRecord_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReactionRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewTitle` VARCHAR(191) NULL,
    `modelType` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL,
    `modelId` INTEGER NOT NULL,
    `content` VARCHAR(191) NULL,
    `rating` INTEGER NULL,

    UNIQUE INDEX `ReactionRecord_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResourceRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `customLabel` VARCHAR(191) NULL,
    `MediaPath` VARCHAR(191) NULL,
    `customUrl` VARCHAR(191) NULL,
    `civitaiUrl` VARCHAR(191) NULL,
    `huggingUrl` VARCHAR(191) NULL,
    `localPath` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `resourceType` ENUM('CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'CONTROLNET', 'URL') NOT NULL DEFAULT 'CHECKPOINT',

    UNIQUE INDEX `ResourceRecord_id_key`(`id`),
    UNIQUE INDEX `ResourceRecord_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectRecord` (
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

    UNIQUE INDEX `ProjectRecord_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BotRecord` ADD CONSTRAINT `BotRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GalleryRecord` ADD CONSTRAINT `GalleryRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaRecord` ADD CONSTRAINT `MediaRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaRecord` ADD CONSTRAINT `MediaRecord_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `GalleryRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaRecord` ADD CONSTRAINT `MediaRecord_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `BotRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromptRecord` ADD CONSTRAINT `PromptRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameRecord` ADD CONSTRAINT `GameRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReactionRecord` ADD CONSTRAINT `ReactionRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceRecord` ADD CONSTRAINT `ResourceRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectRecord` ADD CONSTRAINT `ProjectRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
