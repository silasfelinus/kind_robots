-- CreateTable
CREATE TABLE `Art` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `path` VARCHAR(764) NULL DEFAULT 'UNDEFINED',
    `checkpoint` VARCHAR(256) NULL,
    `sampler` VARCHAR(764) NULL,
    `seed` INTEGER NULL DEFAULT -1,
    `steps` INTEGER NULL,
    `designer` VARCHAR(764) NULL,
    `isPublic` BOOLEAN NULL DEFAULT false,
    `isMature` BOOLEAN NULL DEFAULT false,
    `promptId` INTEGER NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `pitchId` INTEGER NULL,
    `galleryId` INTEGER NULL DEFAULT 21,
    `promptString` TEXT NOT NULL,
    `cfg` INTEGER NULL DEFAULT 3,
    `cfgHalf` BOOLEAN NULL DEFAULT false,
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `serverUrl` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(191) NULL,
    `genres` VARCHAR(191) NULL,
    `negativePrompt` TEXT NULL,

    INDEX `Art_galleryId_fkey`(`galleryId`),
    INDEX `Art_pitchId_fkey`(`pitchId`),
    INDEX `Art_promptId_fkey`(`promptId`),
    INDEX `Art_userId_fkey`(`userId`),
    INDEX `Art_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `galleryId` INTEGER NULL DEFAULT 21,
    `imageData` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL DEFAULT 10,
    `artId` INTEGER NULL,
    `fileName` VARCHAR(764) NULL,
    `fileType` VARCHAR(191) NOT NULL DEFAULT 'png',
    `botId` INTEGER NULL,
    `componentId` INTEGER NULL,
    `milestoneId` INTEGER NULL,
    `pitchId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `reactionId` INTEGER NULL,
    `resourceId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `tagId` INTEGER NULL,
    `chatId` INTEGER NULL,
    `characterId` INTEGER NULL,

    UNIQUE INDEX `ArtImage_artId_key`(`artId`),
    UNIQUE INDEX `ArtImage_botId_key`(`botId`),
    UNIQUE INDEX `ArtImage_componentId_key`(`componentId`),
    UNIQUE INDEX `ArtImage_milestoneId_key`(`milestoneId`),
    UNIQUE INDEX `ArtImage_pitchId_key`(`pitchId`),
    UNIQUE INDEX `ArtImage_promptId_key`(`promptId`),
    UNIQUE INDEX `ArtImage_reactionId_key`(`reactionId`),
    UNIQUE INDEX `ArtImage_resourceId_key`(`resourceId`),
    UNIQUE INDEX `ArtImage_rewardId_key`(`rewardId`),
    UNIQUE INDEX `ArtImage_tagId_key`(`tagId`),
    UNIQUE INDEX `ArtImage_chatId_key`(`chatId`),
    UNIQUE INDEX `ArtImage_characterId_key`(`characterId`),
    INDEX `ArtImage_galleryId_fkey`(`galleryId`),
    INDEX `ArtImage_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL DEFAULT 10,
    `label` VARCHAR(191) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,

    INDEX `ArtCollection_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `BotType` VARCHAR(764) NOT NULL,
    `name` VARCHAR(256) NOT NULL,
    `subtitle` VARCHAR(764) NULL,
    `description` VARCHAR(764) NULL,
    `avatarImage` VARCHAR(764) NULL,
    `botIntro` VARCHAR(3000) NOT NULL,
    `userIntro` VARCHAR(764) NOT NULL,
    `prompt` VARCHAR(764) NOT NULL,
    `trainingPath` VARCHAR(764) NULL,
    `theme` VARCHAR(764) NULL,
    `personality` VARCHAR(764) NULL,
    `modules` VARCHAR(764) NULL,
    `sampleResponse` VARCHAR(764) NULL,
    `tagline` VARCHAR(764) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 1,
    `designer` VARCHAR(191) NOT NULL DEFAULT 'silasfelinus',
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,

    UNIQUE INDEX `Bot_id_key`(`name`(200)),
    INDEX `Bot_userId_fkey`(`userId`),
    INDEX `Bot_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(256) NOT NULL,
    `achievements` VARCHAR(256) NULL,
    `alignment` VARCHAR(256) NULL,
    `experience` INTEGER NULL DEFAULT 0,
    `level` INTEGER NULL DEFAULT 1,
    `class` VARCHAR(764) NULL,
    `species` VARCHAR(764) NULL,
    `backstory` VARCHAR(2048) NULL,
    `drive` VARCHAR(764) NULL,
    `inventory` VARCHAR(2048) NULL,
    `statName1` VARCHAR(191) NULL DEFAULT 'Luck',
    `statValue1` INTEGER NULL DEFAULT 59,
    `statName2` VARCHAR(191) NULL DEFAULT 'Swol',
    `statValue2` INTEGER NULL DEFAULT 49,
    `statName3` VARCHAR(191) NULL DEFAULT 'Wits',
    `statValue3` INTEGER NULL DEFAULT 72,
    `statName4` VARCHAR(191) NULL DEFAULT 'Flexibilty',
    `statValue4` INTEGER NULL DEFAULT 93,
    `statName5` VARCHAR(191) NULL DEFAULT 'Rizz',
    `statValue5` INTEGER NULL DEFAULT 9,
    `statName6` VARCHAR(191) NULL DEFAULT 'Empathy',
    `statValue6` INTEGER NULL DEFAULT 71,
    `quirks` VARCHAR(2048) NULL,
    `skills` VARCHAR(2048) NULL,
    `genre` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL DEFAULT 10,
    `artPrompt` VARCHAR(191) NULL,
    `goalStat1Name` VARCHAR(191) NULL DEFAULT 'Principled|Chaotic',
    `goalStat1Value` INTEGER NULL DEFAULT 0,
    `goalStat2Name` VARCHAR(191) NULL DEFAULT 'Introvert|Extrovert',
    `goalStat2Value` INTEGER NULL DEFAULT 0,
    `goalStat3Name` VARCHAR(191) NULL DEFAULT 'Passive|Aggressive',
    `goalStat3Value` INTEGER NULL DEFAULT 0,
    `goalStat4Name` VARCHAR(191) NULL DEFAULT 'Optimist|Pessimist',
    `goalStat4Value` INTEGER NULL DEFAULT 0,
    `honorific` VARCHAR(191) NULL DEFAULT 'adventurer',
    `imagePath` VARCHAR(256) NULL,
    `designer` VARCHAR(191) NULL,
    `personality` VARCHAR(191) NULL,

    INDEX `Character_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia') NOT NULL,
    `sender` VARCHAR(255) NOT NULL,
    `recipient` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `title` VARCHAR(255) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `previousEntryId` INTEGER NULL,
    `originId` INTEGER NULL,
    `userId` INTEGER NULL,
    `botId` INTEGER NULL,
    `recipientId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `botName` VARCHAR(255) NULL,
    `channel` VARCHAR(255) NULL,
    `botResponse` VARCHAR(191) NULL,
    `characterId` INTEGER NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,

    INDEX `Chat_serverId_fkey`(`serverId`),
    INDEX `Chat_botId_fkey`(`botId`),
    INDEX `Chat_characterId_fkey`(`characterId`),
    INDEX `Chat_promptId_fkey`(`promptId`),
    INDEX `Chat_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Component` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `folderName` VARCHAR(191) NOT NULL,
    `componentName` VARCHAR(191) NOT NULL,
    `isWorking` BOOLEAN NOT NULL DEFAULT true,
    `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    `isBroken` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `artImageId` INTEGER NULL,

    UNIQUE INDEX `Component_componentName_key`(`componentName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dominion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(256) NOT NULL,
    `slug` VARCHAR(256) NULL,
    `description` TEXT NULL,
    `italics` VARCHAR(764) NULL,
    `color` VARCHAR(64) NULL,
    `designer` VARCHAR(256) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `artId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `types` LONGTEXT NOT NULL,
    `keywords` LONGTEXT NOT NULL,
    `cardAdd` INTEGER NOT NULL DEFAULT 0,
    `actionAdd` INTEGER NOT NULL DEFAULT 0,
    `buyAdd` INTEGER NOT NULL DEFAULT 0,
    `coinAdd` INTEGER NOT NULL DEFAULT 0,
    `victoryAdd` INTEGER NOT NULL DEFAULT 0,
    `isDuration` BOOLEAN NOT NULL DEFAULT false,
    `durationJSON` LONGTEXT NULL,
    `priceCoins` INTEGER NOT NULL DEFAULT 0,
    `priceDebt` INTEGER NOT NULL DEFAULT 0,
    `pricePotion` INTEGER NOT NULL DEFAULT 0,
    `effects` LONGTEXT NOT NULL,
    `setupText` VARCHAR(764) NULL,
    `notes` VARCHAR(764) NULL,
    `setId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `icon` VARCHAR(128) NULL,

    UNIQUE INDEX `Dominion_slug_key`(`slug`),
    INDEX `DominionCard_userId_idx`(`userId`),
    INDEX `DominionCard_setId_idx`(`setId`),
    INDEX `Dominion_artId_fkey`(`artId`),
    INDEX `Dominion_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(256) NOT NULL,
    `description` TEXT NULL,
    `url` VARCHAR(256) NULL,
    `custodian` VARCHAR(256) NULL,
    `content` VARCHAR(764) NOT NULL,
    `highlightImage` VARCHAR(256) NULL,
    `imagePaths` TEXT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 1,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Gallery_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` TEXT NOT NULL,
    `timestamp` DATETIME(0) NOT NULL,
    `username` VARCHAR(764) NULL,
    `userId` INTEGER NULL,

    INDEX `Log_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Milestone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `label` VARCHAR(764) NOT NULL,
    `message` VARCHAR(764) NOT NULL,
    `icon` VARCHAR(764) NULL,
    `karma` INTEGER NOT NULL DEFAULT 0,
    `pageHint` VARCHAR(764) NULL,
    `subtleHint` VARCHAR(764) NULL,
    `triggerCode` VARCHAR(764) NULL,
    `tooltip` VARCHAR(764) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isRepeatable` BOOLEAN NOT NULL DEFAULT true,
    `artImageId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MilestoneRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `username` VARCHAR(764) NULL,
    `milestoneId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `isConfirmed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `MilestoneRecord_milestoneId_fkey`(`milestoneId`),
    INDEX `MilestoneRecord_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pitch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(256) NULL,
    `pitch` VARCHAR(764) NOT NULL,
    `designer` VARCHAR(256) NULL,
    `flavorText` VARCHAR(512) NULL,
    `highlightImage` VARCHAR(256) NULL,
    `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'ARTGALLERY', 'INSPIRATION') NOT NULL DEFAULT 'ARTPITCH',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NULL DEFAULT 1,
    `imagePrompt` VARCHAR(256) NULL,
    `description` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `examples` LONGTEXT NULL,
    `icon` VARCHAR(191) NULL,

    INDEX `Pitch_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prompt` TEXT NOT NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `galleryId` INTEGER NULL DEFAULT 21,
    `pitchId` INTEGER NULL,
    `botId` INTEGER NULL,
    `artImageId` INTEGER NULL,

    INDEX `Prompt_botId_fkey`(`botId`),
    INDEX `Prompt_galleryId_fkey`(`galleryId`),
    INDEX `Prompt_pitchId_fkey`(`pitchId`),
    INDEX `Prompt_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comment` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `artId` INTEGER NULL,
    `pitchId` INTEGER NULL,
    `componentId` INTEGER NULL,
    `reactionType` ENUM('LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED') NOT NULL,
    `reactionCategory` ENUM('ART', 'ART_IMAGE', 'PITCH', 'COMPONENT', 'CHAT_EXCHANGE', 'BOT', 'GALLERY', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'TAG', 'TITLE') NOT NULL DEFAULT 'ART',
    `rating` INTEGER NOT NULL DEFAULT 0,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `resourceId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `tagId` INTEGER NULL,
    `chatId` INTEGER NULL,

    UNIQUE INDEX `Reaction_id_key`(`id`),
    INDEX `Reaction_artId_fkey`(`artId`),
    INDEX `Reaction_pitchId_fkey`(`pitchId`),
    INDEX `Reaction_userId_fkey`(`userId`),
    INDEX `Reaction_componentId_fkey`(`componentId`),
    INDEX `Reaction_botId_fkey`(`botId`),
    INDEX `Reaction_chatId_fkey`(`chatId`),
    INDEX `Reaction_galleryId_fkey`(`galleryId`),
    INDEX `Reaction_promptId_fkey`(`promptId`),
    INDEX `Reaction_resourceId_fkey`(`resourceId`),
    INDEX `Reaction_rewardId_fkey`(`rewardId`),
    INDEX `Reaction_tagId_fkey`(`tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(764) NOT NULL,
    `customLabel` VARCHAR(764) NULL,
    `MediaPath` VARCHAR(764) NULL,
    `customUrl` VARCHAR(764) NULL,
    `civitaiUrl` VARCHAR(764) NULL,
    `huggingUrl` VARCHAR(764) NULL,
    `localPath` VARCHAR(764) NULL,
    `description` TEXT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `resourceType` ENUM('CHECKPOINT', 'EMBEDDING', 'LORA', 'LYCORIS', 'HYPERNETWORK', 'SAMPLER', 'CONTROLNET', 'URL', 'API') NOT NULL DEFAULT 'EMBEDDING',
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `generation` VARCHAR(191) NULL,

    UNIQUE INDEX `Resource_id_key`(`name`(200)),
    INDEX `Resource_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `icon` VARCHAR(256) NOT NULL,
    `text` VARCHAR(764) NOT NULL,
    `power` VARCHAR(764) NOT NULL,
    `collection` VARCHAR(764) NOT NULL,
    `rarity` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(191) NULL,
    `imagePrompt` VARCHAR(191) NULL,

    INDEX `Reward_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Scenario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `intros` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(191) NULL,
    `locations` VARCHAR(191) NULL,
    `artPrompt` VARCHAR(191) NULL,
    `genres` VARCHAR(191) NULL,
    `inspirations` VARCHAR(191) NULL,

    INDEX `Scenario_artImageId_fkey`(`artImageId`),
    INDEX `Scenario_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Server` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `serverType` ENUM('ART', 'TEXT', 'COMFY', 'A1111', 'OPENAI_COMPATIBLE', 'OTHER') NOT NULL DEFAULT 'ART',
    `category` VARCHAR(191) NULL,
    `baseUrl` VARCHAR(191) NOT NULL,
    `endpointPath` VARCHAR(191) NULL,
    `healthPath` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isEditable` BOOLEAN NOT NULL DEFAULT true,
    `requiresApiKey` BOOLEAN NOT NULL DEFAULT false,
    `apiKeyName` VARCHAR(191) NULL,
    `supportsTxt2Img` BOOLEAN NOT NULL DEFAULT false,
    `supportsImg2Img` BOOLEAN NOT NULL DEFAULT false,
    `supportsChat` BOOLEAN NOT NULL DEFAULT false,
    `supportsComfyWorkflow` BOOLEAN NOT NULL DEFAULT false,
    `supportsCheckpointOverride` BOOLEAN NOT NULL DEFAULT false,
    `supportsSampler` BOOLEAN NOT NULL DEFAULT false,
    `supportsNegativePrompt` BOOLEAN NOT NULL DEFAULT false,
    `supportsSeed` BOOLEAN NOT NULL DEFAULT false,
    `supportsSteps` BOOLEAN NOT NULL DEFAULT false,
    `supportsVideo` BOOLEAN NOT NULL DEFAULT false,
    `model` VARCHAR(191) NULL,
    `apiKey` VARCHAR(191) NULL,
    `designer` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NULL,

    INDEX `Server_serverType_idx`(`serverType`),
    INDEX `Server_isPublic_idx`(`isPublic`),
    INDEX `Server_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmartIcon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `designer` VARCHAR(255) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `icon` VARCHAR(255) NULL,
    `label` VARCHAR(255) NULL,
    `link` VARCHAR(512) NULL,
    `component` VARCHAR(255) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(255) NULL,
    `category` VARCHAR(255) NULL,
    `modelType` VARCHAR(255) NULL,

    INDEX `SmartIcon_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `label` VARCHAR(256) NOT NULL,
    `title` VARCHAR(256) NOT NULL,
    `flavorText` VARCHAR(764) NULL,
    `pitch` VARCHAR(764) NULL,
    `isPublic` BOOLEAN NULL DEFAULT false,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,

    INDEX `Tag_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Theme` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `values` LONGTEXT NOT NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tagline` VARCHAR(191) NULL,
    `room` VARCHAR(191) NULL,
    `colorScheme` VARCHAR(191) NOT NULL DEFAULT 'light',
    `prefersDark` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Theme_name_key`(`name`),
    INDEX `Theme_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
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
    `karma` INTEGER NOT NULL DEFAULT 0,
    `mana` INTEGER NOT NULL DEFAULT 0,
    `clickRecord` INTEGER NULL DEFAULT 0,
    `matchRecord` INTEGER NULL DEFAULT 0,
    `showMature` BOOLEAN NOT NULL DEFAULT false,
    `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER', 'CHILD') NOT NULL DEFAULT 'USER',
    `artImageId` INTEGER NULL,
    `token` TEXT NULL,
    `designerName` VARCHAR(191) NULL,
    `googleEmail` VARCHAR(255) NULL,
    `googleId` VARCHAR(191) NULL,
    `blockList` VARCHAR(191) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `smartBar` VARCHAR(191) NULL,
    `customIcons` BOOLEAN NOT NULL DEFAULT false,
    `isMember` BOOLEAN NOT NULL DEFAULT false,
    `preferredArtServerId` INTEGER NULL,
    `preferredTextServerId` INTEGER NULL,
    `memberUntil` DATETIME(3) NULL,
    `stripeCustomerId` VARCHAR(64) NULL,
    `artModels` LONGTEXT NULL,
    `lastReward` VARCHAR(191) NULL,
    `textModels` LONGTEXT NULL,
    `vibes` LONGTEXT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ReactionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_ReactionToTag_B_index`(`B`),
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

-- CreateTable
CREATE TABLE `_ArtToArtCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToArtCollection_AB_unique`(`A`, `B`),
    INDEX `_ArtToArtCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CharacterToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToReward_AB_unique`(`A`, `B`),
    INDEX `_CharacterToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CharacterToScenario` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToScenario_AB_unique`(`A`, `B`),
    INDEX `_CharacterToScenario_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ComponentToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ComponentToTag_AB_unique`(`A`, `B`),
    INDEX `_ComponentToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DominionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DominionToTag_AB_unique`(`A`, `B`),
    INDEX `_DominionToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PitchToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PitchToTag_AB_unique`(`A`, `B`),
    INDEX `_PitchToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_reactionId_fkey` FOREIGN KEY (`reactionId`) REFERENCES `Reaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtCollection` ADD CONSTRAINT `ArtCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scenario` ADD CONSTRAINT `Scenario_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scenario` ADD CONSTRAINT `Scenario_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Server` ADD CONSTRAINT `Server_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartIcon` ADD CONSTRAINT `SmartIcon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Theme` ADD CONSTRAINT `Theme_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToArtCollection` ADD CONSTRAINT `_ArtToArtCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToArtCollection` ADD CONSTRAINT `_ArtToArtCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToScenario` ADD CONSTRAINT `_CharacterToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToScenario` ADD CONSTRAINT `_CharacterToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DominionToTag` ADD CONSTRAINT `_DominionToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dominion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DominionToTag` ADD CONSTRAINT `_DominionToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PitchToTag` ADD CONSTRAINT `_PitchToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Pitch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PitchToTag` ADD CONSTRAINT `_PitchToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

