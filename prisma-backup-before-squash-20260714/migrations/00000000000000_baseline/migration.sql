-- CreateTable
CREATE TABLE `ArtImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageData` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL DEFAULT 10,
    `fileName` VARCHAR(764) NULL,
    `fileType` VARCHAR(191) NOT NULL DEFAULT 'png',
    `cfg` INTEGER NULL DEFAULT 3,
    `cfgHalf` BOOLEAN NULL DEFAULT false,
    `checkpoint` VARCHAR(256) NULL,
    `checkpointResourceId` INTEGER NULL,
    `designer` VARCHAR(764) NULL,
    `genres` VARCHAR(191) NULL,
    `imagePath` VARCHAR(191) NULL,
    `isMature` BOOLEAN NULL DEFAULT false,
    `isPublic` BOOLEAN NULL DEFAULT false,
    `negativePrompt` TEXT NULL,
    `path` VARCHAR(764) NULL,
    `promptString` TEXT NULL,
    `sampler` VARCHAR(764) NULL,
    `seed` INTEGER NULL DEFAULT -1,
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `serverUrl` VARCHAR(764) NULL,
    `steps` INTEGER NULL,
    `thumbnailData` MEDIUMTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    INDEX `ArtImage_userId_fkey`(`userId`),
    INDEX `ArtImage_checkpointResourceId_fkey`(`checkpointResourceId`),
    INDEX `ArtImage_serverId_fkey`(`serverId`),
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
    `imagePath` VARCHAR(764) NULL,
    `description` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

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
    `narrativeVoice` TEXT NULL,
    `forgeIntro` TEXT NULL,
    `prompt` VARCHAR(764) NOT NULL,
    `trainingPath` VARCHAR(764) NULL,
    `theme` VARCHAR(764) NULL,
    `personality` VARCHAR(764) NULL,
    `modules` VARCHAR(764) NULL,
    `sampleResponse` VARCHAR(764) NULL,
    `tagline` VARCHAR(764) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 1,
    `imagePath` VARCHAR(764) NULL,
    `designer` VARCHAR(191) NOT NULL DEFAULT 'silasfelinus',
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    INDEX `Bot_userId_fkey`(`userId`),
    INDEX `Bot_serverId_fkey`(`serverId`),
    INDEX `Bot_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Butterfly` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(255) NOT NULL,
    `message` VARCHAR(764) NOT NULL,
    `wingTopColor` VARCHAR(64) NOT NULL,
    `wingBottomColor` VARCHAR(64) NOT NULL,
    `speed` DOUBLE NOT NULL,
    `wingSpeed` DOUBLE NOT NULL,
    `scale` DOUBLE NOT NULL,
    `rarityNumber` INTEGER NOT NULL,
    `designer` VARCHAR(255) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Butterfly_name_key`(`name`),
    UNIQUE INDEX `Butterfly_rarityNumber_key`(`rarityNumber`),
    INDEX `Butterfly_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ButterflyRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `butterflyId` INTEGER NOT NULL,

    INDEX `ButterflyRecord_userId_fkey`(`userId`),
    INDEX `ButterflyRecord_butterflyId_fkey`(`butterflyId`),
    UNIQUE INDEX `ButterflyRecord_userId_butterflyId_key`(`userId`, `butterflyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(256) NOT NULL,
    `achievements` VARCHAR(764) NULL,
    `alignment` VARCHAR(256) NULL,
    `experience` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `class` VARCHAR(764) NULL,
    `species` VARCHAR(764) NULL,
    `backstory` TEXT NULL,
    `drive` VARCHAR(764) NULL,
    `quirks` TEXT NULL,
    `genre` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NOT NULL DEFAULT 10,
    `artPrompt` TEXT NULL,
    `honorific` VARCHAR(256) NULL DEFAULT 'adventurer',
    `imagePath` VARCHAR(764) NULL,
    `designer` VARCHAR(256) NULL,
    `personality` TEXT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `charm` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `empathy` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `grace` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `luck` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `might` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `presentation` VARCHAR(764) NULL,
    `role` VARCHAR(256) NULL,
    `title` VARCHAR(256) NULL,
    `wits` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `gender` VARCHAR(256) NULL,

    INDEX `Character_userId_fkey`(`userId`),
    INDEX `Character_isPublic_idx`(`isPublic`),
    INDEX `Character_isActive_idx`(`isActive`),
    INDEX `Character_name_idx`(`name`),
    INDEX `Character_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,
    `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia', 'Dream', 'Reward', 'Story', 'Scenario', 'Character', 'Bot') NOT NULL,
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
    `dreamId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Chat_serverId_fkey`(`serverId`),
    INDEX `Chat_botId_fkey`(`botId`),
    INDEX `Chat_characterId_fkey`(`characterId`),
    INDEX `Chat_promptId_fkey`(`promptId`),
    INDEX `Chat_userId_fkey`(`userId`),
    INDEX `Chat_dreamId_fkey`(`dreamId`),
    INDEX `Chat_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL DEFAULT 10,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `graph` JSON NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Code_userId_idx`(`userId`),
    INDEX `Code_isPublic_idx`(`isPublic`),
    INDEX `Code_isOfficial_idx`(`isOfficial`),
    INDEX `Code_isActive_idx`(`isActive`),
    INDEX `Code_isMature_idx`(`isMature`),
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
    INDEX `Component_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Composition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(512) NULL,
    `label` VARCHAR(255) NULL,
    `mode` VARCHAR(64) NOT NULL DEFAULT 'both',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(255) NULL DEFAULT 'system',
    `characterId` INTEGER NULL,
    `dreamId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `characterBlurb` VARCHAR(512) NULL,
    `dreamBlurb` VARCHAR(512) NULL,
    `scenarioBlurb` VARCHAR(512) NULL,
    `rewardBlurb` VARCHAR(512) NULL,
    `narrativeText` TEXT NULL,
    `artPrompt` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,
    `userId` INTEGER NULL,
    `artImageId` INTEGER NULL,

    UNIQUE INDEX `Composition_artImageId_key`(`artImageId`),
    INDEX `Composition_userId_idx`(`userId`),
    INDEX `Composition_mode_idx`(`mode`),
    INDEX `Composition_characterId_idx`(`characterId`),
    INDEX `Composition_dreamId_idx`(`dreamId`),
    INDEX `Composition_scenarioId_idx`(`scenarioId`),
    INDEX `Composition_rewardId_idx`(`rewardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dream` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `dreamType` ENUM('ARTDREAM', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'INSPIRATION', 'CHARACTER', 'REWARD', 'SCENARIO', 'TEXT', 'LOCATION', 'PITCH', 'GENRE') NOT NULL DEFAULT 'ARTDREAM',
    `description` TEXT NULL,
    `pitch` TEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `examples` LONGTEXT NULL,
    `artPrompt` VARCHAR(764) NULL,
    `imagePath` TEXT NULL,
    `highlightImage` VARCHAR(256) NULL,
    `icon` VARCHAR(191) NULL,
    `designer` VARCHAR(256) NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `userId` INTEGER NOT NULL DEFAULT 10,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artImageId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,

    UNIQUE INDEX `Dream_slug_key`(`slug`),
    INDEX `Dream_artImageId_fkey`(`artImageId`),
    INDEX `Dream_userId_idx`(`userId`),
    INDEX `Dream_dreamType_idx`(`dreamType`),
    INDEX `Dream_isPublic_idx`(`isPublic`),
    INDEX `Dream_isActive_idx`(`isActive`),
    INDEX `Dream_artCollectionId_idx`(`artCollectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmotionImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expression` ENUM('NEUTRAL', 'JOYFUL', 'SORROWFUL', 'AFRAID', 'DISGUSTED', 'ENRAGED', 'SURPRISED', 'ANXIOUS', 'PROUD', 'LOVING', 'LAUGHING', 'CRYING', 'SLEEPING', 'THINKING', 'SHRUGGING', 'WINKING', 'FACEPALMING', 'CHEERING', 'WHISPERING', 'SHOUTING') NOT NULL DEFAULT 'NEUTRAL',
    `kind` ENUM('EMOTION', 'ACTION') NOT NULL DEFAULT 'EMOTION',
    `label` VARCHAR(256) NULL,
    `emoticon` VARCHAR(32) NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `message` TEXT NULL,
    `additionalPhrases` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `EmotionImage_artImageId_key`(`artImageId`),
    INDEX `EmotionImage_artImageId_idx`(`artImageId`),
    INDEX `EmotionImage_botId_idx`(`botId`),
    INDEX `EmotionImage_characterId_idx`(`characterId`),
    INDEX `EmotionImage_kind_idx`(`kind`),
    INDEX `EmotionImage_botId_kind_idx`(`botId`, `kind`),
    INDEX `EmotionImage_characterId_kind_idx`(`characterId`, `kind`),
    INDEX `EmotionImage_botId_isActive_idx`(`botId`, `isActive`),
    INDEX `EmotionImage_characterId_isActive_idx`(`characterId`, `isActive`),
    UNIQUE INDEX `EmotionImage_botId_expression_key`(`botId`, `expression`),
    UNIQUE INDEX `EmotionImage_characterId_expression_key`(`characterId`, `expression`),
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
    `artPrompt` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,

    INDEX `Milestone_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManaTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` ENUM('SIGNUP_BONUS', 'CYCLE_REFILL', 'GENERATION_ART', 'GENERATION_TEXT', 'SOCIAL_REACTION', 'SOCIAL_SHARE', 'BOUNTY_CREATE', 'BOUNTY_REWARD', 'PURCHASE', 'SUBSCRIPTION_GRANT', 'ADMIN_REFUND', 'KARMA_CONVERSION', 'ADJUSTMENT') NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `refId` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `costUsd` DOUBLE NULL,
    `reversedById` INTEGER NULL,

    INDEX `ManaTransaction_userId_createdAt_idx`(`userId`, `createdAt`),
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
CREATE TABLE `Prompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prompt` TEXT NOT NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `botId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,

    INDEX `Prompt_userId_fkey`(`userId`),
    INDEX `Prompt_artImageId_fkey`(`artImageId`),
    INDEX `Prompt_botId_fkey`(`botId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comment` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `componentId` INTEGER NULL,
    `reactionType` ENUM('LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED') NOT NULL,
    `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'COMPOSITION', 'DREAM', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE',
    `rating` INTEGER NOT NULL DEFAULT 0,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `resourceId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `chatId` INTEGER NULL,
    `dreamId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `butterflyId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `themeId` INTEGER NULL,
    `compositionId` INTEGER NULL,

    UNIQUE INDEX `Reaction_id_key`(`id`),
    INDEX `Reaction_userId_fkey`(`userId`),
    INDEX `Reaction_artImageId_fkey`(`artImageId`),
    INDEX `Reaction_artCollectionId_fkey`(`artCollectionId`),
    INDEX `Reaction_botId_fkey`(`botId`),
    INDEX `Reaction_butterflyId_fkey`(`butterflyId`),
    INDEX `Reaction_characterId_fkey`(`characterId`),
    INDEX `Reaction_chatId_fkey`(`chatId`),
    INDEX `Reaction_componentId_fkey`(`componentId`),
    INDEX `Reaction_dreamId_fkey`(`dreamId`),
    INDEX `Reaction_promptId_fkey`(`promptId`),
    INDEX `Reaction_resourceId_fkey`(`resourceId`),
    INDEX `Reaction_rewardId_fkey`(`rewardId`),
    INDEX `Reaction_scenarioId_fkey`(`scenarioId`),
    INDEX `Reaction_themeId_fkey`(`themeId`),
    INDEX `Reaction_compositionId_idx`(`compositionId`),
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
    `imagePath` VARCHAR(191) NULL,
    `generation` VARCHAR(191) NULL,
    `supportedServer` ENUM('SD15', 'SDXL', 'COMFY', 'FLUX', 'KONTEXT', 'GENERIC', 'UNKNOWN', 'OPENAI') NOT NULL DEFAULT 'SDXL',
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `Resource_id_key`(`name`(200)),
    INDEX `Resource_userId_fkey`(`userId`),
    INDEX `Resource_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(256) NOT NULL,
    `slug` VARCHAR(256) NULL,
    `description` TEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `effect` TEXT NULL,
    `icon` VARCHAR(256) NULL,
    `collection` VARCHAR(764) NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `rewardType` ENUM('SKILL', 'ITEM', 'POWER', 'PET', 'MAGIC', 'FAVOR') NOT NULL DEFAULT 'ITEM',
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(764) NULL,
    `artPrompt` TEXT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Reward_slug_key`(`slug`),
    INDEX `Reward_userId_fkey`(`userId`),
    INDEX `Reward_rewardType_idx`(`rewardType`),
    INDEX `Reward_rarity_idx`(`rarity`),
    INDEX `Reward_slug_idx`(`slug`),
    INDEX `Reward_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Scenario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `intros` TEXT NOT NULL,
    `userId` INTEGER NOT NULL,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(191) NULL,
    `locations` TEXT NULL,
    `artPrompt` TEXT NULL,
    `genres` VARCHAR(191) NULL,
    `inspirations` TEXT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `difficulty` INTEGER NULL,
    `tier` VARCHAR(191) NULL,
    `group` VARCHAR(191) NULL,
    `secretNotes` VARCHAR(191) NULL,
    `cast` JSON NULL,
    `outputType` ENUM('STORY', 'ART', 'CHARACTER', 'REWARD', 'DREAM', 'SCENARIO', 'MIXED') NOT NULL DEFAULT 'STORY',

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
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `serverType` ENUM('A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `accessMode` ENUM('BROWSER', 'BACKEND', 'TAILSCALE', 'PUBLIC', 'LOCAL') NOT NULL DEFAULT 'BROWSER',
    `authType` ENUM('NONE', 'BEARER', 'HEADER', 'QUERY', 'API_KEY') NOT NULL DEFAULT 'NONE',
    `baseUrl` VARCHAR(764) NULL,
    `endpointPath` VARCHAR(512) NULL,
    `healthPath` VARCHAR(512) NULL,
    `apiLink` VARCHAR(764) NULL,
    `apiKey` TEXT NULL,
    `apiKeyName` VARCHAR(255) NULL,
    `model` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `designer` VARCHAR(255) NULL,
    `version` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isEditable` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `artPrompt` TEXT NULL,

    INDEX `Server_serverType_idx`(`serverType`),
    INDEX `Server_accessMode_idx`(`accessMode`),
    INDEX `Server_authType_idx`(`authType`),
    INDEX `Server_isPublic_idx`(`isPublic`),
    INDEX `Server_isOfficial_idx`(`isOfficial`),
    INDEX `Server_isDefault_idx`(`isDefault`),
    INDEX `Server_isActive_idx`(`isActive`),
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
    `isMature` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SmartIcon_userId_fkey`(`userId`),
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
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

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
    `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER', 'CHILD', 'FAMILY') NOT NULL DEFAULT 'USER',
    `artImageId` INTEGER NULL,
    `token` TEXT NULL,
    `designerName` VARCHAR(191) NULL,
    `googleEmail` VARCHAR(255) NULL,
    `googleId` VARCHAR(191) NULL,
    `blockList` VARCHAR(191) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `smartBar` TEXT NULL,
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
    `HiddenServers` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `manaCap` INTEGER NOT NULL DEFAULT 500,
    `lastManaRefill` DATETIME(3) NULL,
    `signupBonusGiven` BOOLEAN NOT NULL DEFAULT false,
    `isGuest` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `relatedUserId` INTEGER NOT NULL,
    `type` ENUM('FRIEND', 'BLOCK', 'PARENT', 'CHILD', 'REFEREE') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `note` TEXT NULL,
    `pairId` INTEGER NULL,

    INDEX `UserRelation_userId_fkey`(`userId`),
    INDEX `UserRelation_relatedUserId_fkey`(`relatedUserId`),
    INDEX `UserRelation_type_idx`(`type`),
    INDEX `UserRelation_status_idx`(`status`),
    INDEX `UserRelation_pairId_idx`(`pairId`),
    UNIQUE INDEX `UserRelation_userId_relatedUserId_type_key`(`userId`, `relatedUserId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtImage_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtImageLoraResources` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtImageLoraResources_AB_unique`(`A`, `B`),
    INDEX `_ArtImageLoraResources_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToArtCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtCollection_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtCollectionToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtCollectionToArtImage_AB_unique`(`A`, `B`),
    INDEX `_ArtCollectionToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BotToDream` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToDream_AB_unique`(`A`, `B`),
    INDEX `_BotToDream_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CharacterToDream` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToDream_AB_unique`(`A`, `B`),
    INDEX `_CharacterToDream_B_index`(`B`)
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
CREATE TABLE `_DreamToScenario` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToScenario_AB_unique`(`A`, `B`),
    INDEX `_DreamToScenario_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToReward_AB_unique`(`A`, `B`),
    INDEX `_DreamToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ResourceToServer` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ResourceToServer_AB_unique`(`A`, `B`),
    INDEX `_ResourceToServer_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_checkpointResourceId_fkey` FOREIGN KEY (`checkpointResourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtCollection` ADD CONSTRAINT `ArtCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ButterflyRecord` ADD CONSTRAINT `ButterflyRecord_butterflyId_fkey` FOREIGN KEY (`butterflyId`) REFERENCES `Butterfly`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ButterflyRecord` ADD CONSTRAINT `ButterflyRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Code` ADD CONSTRAINT `Code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Component` ADD CONSTRAINT `Component_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManaTransaction` ADD CONSTRAINT `ManaTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_butterflyId_fkey` FOREIGN KEY (`butterflyId`) REFERENCES `Butterfly`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_compositionId_fkey` FOREIGN KEY (`compositionId`) REFERENCES `Composition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Theme` ADD CONSTRAINT `Theme_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_relatedUserId_fkey` FOREIGN KEY (`relatedUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToDream` ADD CONSTRAINT `_BotToDream_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToDream` ADD CONSTRAINT `_BotToDream_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToDream` ADD CONSTRAINT `_CharacterToDream_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToDream` ADD CONSTRAINT `_CharacterToDream_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToScenario` ADD CONSTRAINT `_CharacterToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToScenario` ADD CONSTRAINT `_CharacterToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

