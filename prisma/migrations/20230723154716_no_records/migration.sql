/*
  Warnings:

  - You are about to drop the `BotRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GalleryRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromptRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReactionRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResourceRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BotRecord` DROP FOREIGN KEY `BotRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GalleryRecord` DROP FOREIGN KEY `GalleryRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GameRecord` DROP FOREIGN KEY `GameRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MediaRecord` DROP FOREIGN KEY `MediaRecord_botId_fkey`;

-- DropForeignKey
ALTER TABLE `MediaRecord` DROP FOREIGN KEY `MediaRecord_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `MediaRecord` DROP FOREIGN KEY `MediaRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectRecord` DROP FOREIGN KEY `ProjectRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PromptRecord` DROP FOREIGN KEY `PromptRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ReactionRecord` DROP FOREIGN KEY `ReactionRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ResourceRecord` DROP FOREIGN KEY `ResourceRecord_userId_fkey`;

-- DropTable
DROP TABLE `BotRecord`;

-- DropTable
DROP TABLE `GalleryRecord`;

-- DropTable
DROP TABLE `GameRecord`;

-- DropTable
DROP TABLE `MediaRecord`;

-- DropTable
DROP TABLE `ProjectRecord`;

-- DropTable
DROP TABLE `PromptRecord`;

-- DropTable
DROP TABLE `ReactionRecord`;

-- DropTable
DROP TABLE `ResourceRecord`;

-- DropTable
DROP TABLE `UserRecord`;

-- CreateTable
CREATE TABLE `Bot` (
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

    UNIQUE INDEX `Bot_id_key`(`id`),
    UNIQUE INDEX `Bot_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gallery` (
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

    UNIQUE INDEX `Gallery_id_key`(`id`),
    UNIQUE INDEX `Gallery_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

    UNIQUE INDEX `Media_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prompt` (
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

    UNIQUE INDEX `Prompt_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
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

    UNIQUE INDEX `User_id_key`(`id`),
    UNIQUE INDEX `User_username_key`(`username`),
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

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewTitle` VARCHAR(191) NULL,
    `modelType` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL,
    `modelId` INTEGER NOT NULL,
    `content` VARCHAR(191) NULL,
    `rating` INTEGER NULL,

    UNIQUE INDEX `Reaction_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
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

    UNIQUE INDEX `Resource_id_key`(`id`),
    UNIQUE INDEX `Resource_name_key`(`name`),
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

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
