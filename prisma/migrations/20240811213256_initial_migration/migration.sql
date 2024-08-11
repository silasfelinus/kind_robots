-- CreateTable
CREATE TABLE `Art` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `galleryId` INTEGER NULL DEFAULT 0,
    `path` VARCHAR(764) NOT NULL,
    `prompt` TEXT NULL,
    `artPromptId` INTEGER NULL DEFAULT 0,
    `userId` INTEGER NULL DEFAULT 0,
    `pitchId` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,
    `boos` INTEGER NULL DEFAULT 0,
    `claps` INTEGER NULL DEFAULT 0,
    `cfg` VARCHAR(764) NULL,
    `checkpoint` VARCHAR(764) NULL,
    `sampler` VARCHAR(764) NULL,
    `seed` INTEGER NULL DEFAULT 0,
    `steps` INTEGER NULL DEFAULT 0,
    `pitch` VARCHAR(764) NULL,
    `channelId` INTEGER NULL DEFAULT 0,
    `isOrphan` TINYINT NULL DEFAULT 0,
    `isPublic` TINYINT NULL DEFAULT 0,
    `isMature` TINYINT NULL DEFAULT 0,
    `designer` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtPrompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `prompt` VARCHAR(8000) NOT NULL,
    `galleryId` INTEGER NULL DEFAULT 0,
    `pitch` VARCHAR(764) NULL,
    `pitchId` INTEGER NULL DEFAULT 0,
    `DB_ROW_HASH_1` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtReaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,
    `artId` INTEGER NULL,
    `claps` INTEGER NOT NULL DEFAULT 0,
    `boos` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `reaction` VARCHAR(191) NULL,
    `pitchId` INTEGER NULL,

    UNIQUE INDEX `ArtReaction_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `BotType` VARCHAR(764) NOT NULL,
    `name` VARCHAR(764) NOT NULL,
    `isPublic` TINYINT NOT NULL DEFAULT 0,
    `underConstruction` TINYINT NOT NULL DEFAULT 0,
    `canDelete` TINYINT NOT NULL DEFAULT 0,
    `subtitle` VARCHAR(764) NOT NULL,
    `description` VARCHAR(764) NOT NULL,
    `avatarImage` VARCHAR(764) NOT NULL,
    `botIntro` VARCHAR(764) NOT NULL,
    `userIntro` VARCHAR(764) NOT NULL,
    `prompt` VARCHAR(764) NOT NULL,
    `trainingPath` VARCHAR(764) NULL,
    `theme` VARCHAR(764) NULL,
    `personality` VARCHAR(764) NOT NULL,
    `modules` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 0,
    `sampleResponse` VARCHAR(764) NULL,
    `tagline` VARCHAR(764) NULL,

    UNIQUE INDEX `Bot_id_key`(`name`(200)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `userId` INTEGER NULL DEFAULT 16580608,
    `label` VARCHAR(764) NOT NULL,
    `description` VARCHAR(8000) NULL,
    `tagId` INTEGER NULL DEFAULT 0,
    `title` VARCHAR(764) NULL,
    `pitchId` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `Channel_id_key`(`label`(200)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatExchange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `botId` INTEGER NULL DEFAULT 57088,
    `botName` VARCHAR(255) NOT NULL,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `userPrompt` TEXT NOT NULL,
    `botResponse` TEXT NOT NULL,
    `liked` TINYINT NULL DEFAULT 0,
    `hated` TINYINT NULL DEFAULT 0,
    `loved` TINYINT NULL DEFAULT 0,
    `flagged` TINYINT NULL DEFAULT 0,
    `previousEntryId` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `name` VARCHAR(764) NOT NULL,
    `description` TEXT NULL,
    `mediaId` VARCHAR(764) NULL,
    `url` VARCHAR(764) NULL,
    `custodian` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 0,
    `content` VARCHAR(764) NOT NULL,
    `highlightImage` VARCHAR(764) NULL,
    `imagePaths` TEXT NULL,
    `isMature` TINYINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `Gallery_id_key`(`name`(200)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Game` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `content` TEXT NOT NULL,
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
CREATE TABLE `Log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` TEXT NOT NULL,
    `timestamp` DATETIME(0) NOT NULL,
    `username` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `sender` VARCHAR(764) NOT NULL,
    `recipient` VARCHAR(764) NOT NULL,
    `content` TEXT NOT NULL,
    `channelId` INTEGER NOT NULL,
    `botId` INTEGER NULL DEFAULT 0,
    `userId` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Milestone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(764) NOT NULL,
    `message` VARCHAR(764) NOT NULL,
    `icon` VARCHAR(764) NOT NULL,
    `karma` INTEGER NOT NULL DEFAULT 0,
    `isRepeatable` TINYINT NOT NULL DEFAULT 100,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `triggerCode` VARCHAR(764) NOT NULL,
    `tooltip` VARCHAR(764) NULL,
    `isActive` TINYINT NOT NULL DEFAULT 0,
    `pageHint` VARCHAR(764) NULL,
    `subtleHint` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MilestoneRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `milestoneId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pitch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `title` VARCHAR(764) NOT NULL,
    `pitch` VARCHAR(764) NOT NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `isPublic` TINYINT NOT NULL DEFAULT 0,
    `claps` INTEGER NOT NULL DEFAULT 0,
    `boos` INTEGER NOT NULL DEFAULT 0,
    `channelId` INTEGER NULL DEFAULT 0,
    `designer` VARCHAR(256) NOT NULL,
    `flavorText` VARCHAR(512) NULL,
    `isOrphan` TINYINT NOT NULL DEFAULT 0,
    `creatorId` INTEGER NULL DEFAULT 0,
    `highlightImage` VARCHAR(256) NOT NULL,
    `isMature` TINYINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `Pitch_title_key`(`title`),
    UNIQUE INDEX `Pitch_channelId_key`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `customerId` INTEGER NOT NULL,

    UNIQUE INDEX `Cart_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cartId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `CartItem_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `userId` INTEGER NULL,

    UNIQUE INDEX `Customer_id_key`(`id`),
    UNIQUE INDEX `Customer_email_key`(`email`),
    UNIQUE INDEX `Customer_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RandomList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(764) NOT NULL,
    `items` LONGTEXT NOT NULL,
    `userId` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `userId` INTEGER NULL DEFAULT 0,
    `username` VARCHAR(764) NOT NULL,
    `content` VARCHAR(764) NOT NULL,
    `title` VARCHAR(764) NULL,
    `label` VARCHAR(764) NOT NULL,
    `imagePath` VARCHAR(764) NULL,
    `artId` INTEGER NULL DEFAULT 0,
    `pitchId` INTEGER NULL DEFAULT 0,
    `pitchname` VARCHAR(764) NULL,
    `sloganContent` VARCHAR(764) NULL,
    `sloganId` INTEGER NULL DEFAULT 0,
    `botId` INTEGER NULL DEFAULT 0,
    `botname` VARCHAR(764) NULL,
    `channelId` INTEGER NULL DEFAULT 0,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `hates` INTEGER NOT NULL DEFAULT 0,
    `loves` INTEGER NOT NULL DEFAULT 0,
    `jellybeanClaps` INTEGER NOT NULL DEFAULT 0,
    `isFavorite` TINYINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `title` VARCHAR(764) NOT NULL,
    `category` VARCHAR(764) NOT NULL,
    `flavorText` VARCHAR(764) NULL,
    `description` VARCHAR(8000) NOT NULL,
    `costInPennies` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `passcode` VARCHAR(764) NULL,
    `imagePath` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `userId` INTEGER NULL DEFAULT -65536,
    `name` VARCHAR(764) NOT NULL,
    `customLabel` VARCHAR(764) NULL,
    `MediaPath` VARCHAR(764) NULL,
    `customUrl` VARCHAR(764) NULL,
    `civitaiUrl` VARCHAR(764) NULL,
    `huggingUrl` VARCHAR(764) NULL,
    `localPath` VARCHAR(764) NULL,
    `description` TEXT NULL,
    `resourceType` ENUM('CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'CONTROLNET', 'URL', 'API') NOT NULL,
    `isMature` TINYINT NOT NULL DEFAULT 0,
    `galleryCount` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `Resource_id_key`(`name`(200)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `icon` VARCHAR(256) NOT NULL,
    `text` VARCHAR(764) NOT NULL,
    `power` VARCHAR(764) NOT NULL,
    `collection` VARCHAR(764) NOT NULL,
    `rarity` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(764) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Slogan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contentType` VARCHAR(191) NOT NULL DEFAULT 'slogan',
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'Anti-Malaria Fundraiser',
    `url` VARCHAR(191) NULL DEFAULT 'https://www.againstmalaria.org/amibot',
    `characterLimit` INTEGER NOT NULL DEFAULT 300,
    `content` VARCHAR(2000) NOT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `hates` INTEGER NOT NULL DEFAULT 0,
    `loves` INTEGER NOT NULL DEFAULT 0,
    `isLiked` BOOLEAN NOT NULL DEFAULT false,
    `isLoved` BOOLEAN NOT NULL DEFAULT false,
    `wasKept` BOOLEAN NULL,
    `wasDiscarded` BOOLEAN NULL,
    `username` VARCHAR(191) NOT NULL DEFAULT 'Kind Guest',
    `userId` INTEGER NOT NULL DEFAULT 0,
    `model` VARCHAR(191) NOT NULL DEFAULT '3.5',
    `kindRobot` VARCHAR(191) NOT NULL DEFAULT 'amibot',
    `botId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `label` VARCHAR(256) NOT NULL,
    `title` VARCHAR(256) NOT NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `isPublic` TINYINT NULL DEFAULT 0,
    `channelId` INTEGER NULL DEFAULT 0,
    `flavorText` VARCHAR(764) NULL,
    `pitch` VARCHAR(764) NULL,
    `isMature` TINYINT NOT NULL DEFAULT 0,
    `sloganId` INTEGER NULL DEFAULT 0,
    `postId` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `Tag_channelId_key`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `rewardId` INTEGER NULL,
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NULL,
    `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER', 'CHILD') NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `questPoints` INTEGER NOT NULL DEFAULT 0,
    `emailVerified` DATETIME(0) NULL,
    `name` VARCHAR(255) NULL,
    `address1` TEXT NULL,
    `address2` TEXT NULL,
    `avatarImage` TEXT NULL,
    `bio` TEXT NULL,
    `birthday` DATETIME(0) NULL,
    `city` TEXT NULL,
    `country` TEXT NULL,
    `discordUrl` TEXT NULL,
    `facebookUrl` TEXT NULL,
    `instagramUrl` TEXT NULL,
    `kindrobotsUrl` TEXT NULL,
    `languages` TEXT NULL,
    `phone` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `timezone` VARCHAR(255) NULL,
    `twitterUrl` TEXT NULL,
    `apiKey` TEXT NULL,
    `password` TEXT NULL,
    `spotifyAccessToken` TEXT NULL,
    `spotifyID` TEXT NULL,
    `spotifyRefreshToken` TEXT NULL,
    `karma` INTEGER NOT NULL DEFAULT 0,
    `mana` INTEGER NOT NULL DEFAULT 0,
    `clickRecord` INTEGER NULL DEFAULT 0,
    `matchRecord` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtReactionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_ArtReactionToTag_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtToProduct` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_ArtToProduct_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_ArtToTag_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_MilestoneToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_MilestoneToUser_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RewardToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_RewardToUser_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slogan` ADD CONSTRAINT `Slogan_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slogan` ADD CONSTRAINT `Slogan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
