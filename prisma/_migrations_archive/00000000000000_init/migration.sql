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
    `designer` VARCHAR(191) NOT NULL DEFAULT 'silasfelinus',
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `Bot_id_key`(`name`(200)),
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
    `artImageId` INTEGER NULL,
    `designer` VARCHAR(255) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `artCollectionId` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `pitchId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `tagId` INTEGER NULL,

    UNIQUE INDEX `Butterfly_name_key`(`name`),
    UNIQUE INDEX `Butterfly_rarityNumber_key`(`rarityNumber`),
    INDEX `Butterfly_userId_fkey`(`userId`),
    INDEX `Butterfly_artCollectionId_fkey`(`artCollectionId`),
    INDEX `Butterfly_botId_fkey`(`botId`),
    INDEX `Butterfly_characterId_fkey`(`characterId`),
    INDEX `Butterfly_pitchId_fkey`(`pitchId`),
    INDEX `Butterfly_promptId_fkey`(`promptId`),
    INDEX `Butterfly_scenarioId_fkey`(`scenarioId`),
    INDEX `Butterfly_artImageId_fkey`(`artImageId`),
    INDEX `Butterfly_tagId_fkey`(`tagId`),
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
CREATE TABLE `Dream` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `currentVibe` TEXT NULL,
    `currentPrompt` TEXT NULL,
    `userId` INTEGER NOT NULL DEFAULT 10,
    `pitchId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `textServerId` INTEGER NULL,
    `artServerId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `accessMode` ENUM('OPEN', 'CODE', 'PRIVATE', 'SOLO') NOT NULL DEFAULT 'OPEN',
    `privacyCode` VARCHAR(255) NULL,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `Dream_slug_key`(`slug`),
    INDEX `Dream_artImageId_fkey`(`artImageId`),
    INDEX `Dream_userId_idx`(`userId`),
    INDEX `Dream_accessMode_idx`(`accessMode`),
    INDEX `Dream_isPublic_idx`(`isPublic`),
    INDEX `Dream_isActive_idx`(`isActive`),
    INDEX `Dream_artCollectionId_idx`(`artCollectionId`),
    INDEX `Dream_galleryId_idx`(`galleryId`),
    INDEX `Dream_pitchId_idx`(`pitchId`),
    INDEX `Dream_scenarioId_idx`(`scenarioId`),
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

    INDEX `Milestone_artImageId_fkey`(`artImageId`),
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
    `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'ARTGALLERY', 'INSPIRATION', 'DREAM') NOT NULL DEFAULT 'ARTPITCH',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NULL DEFAULT 1,
    `description` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `examples` LONGTEXT NULL,
    `icon` VARCHAR(191) NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    INDEX `Pitch_userId_fkey`(`userId`),
    INDEX `Pitch_artImageId_fkey`(`artImageId`),
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
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    INDEX `Prompt_userId_fkey`(`userId`),
    INDEX `Prompt_artImageId_fkey`(`artImageId`),
    INDEX `Prompt_botId_fkey`(`botId`),
    INDEX `Prompt_galleryId_fkey`(`galleryId`),
    INDEX `Prompt_pitchId_fkey`(`pitchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comment` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `pitchId` INTEGER NULL,
    `componentId` INTEGER NULL,
    `reactionType` ENUM('LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED') NOT NULL,
    `reactionCategory` ENUM('ART', 'ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'GALLERY', 'MESSAGE', 'PITCH', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'TAG', 'THEME') NOT NULL DEFAULT 'ART',
    `rating` INTEGER NOT NULL DEFAULT 0,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `resourceId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `tagId` INTEGER NULL,
    `chatId` INTEGER NULL,
    `dreamId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `butterflyId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `themeId` INTEGER NULL,

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
    INDEX `Reaction_pitchId_fkey`(`pitchId`),
    INDEX `Reaction_promptId_fkey`(`promptId`),
    INDEX `Reaction_resourceId_fkey`(`resourceId`),
    INDEX `Reaction_rewardId_fkey`(`rewardId`),
    INDEX `Reaction_scenarioId_fkey`(`scenarioId`),
    INDEX `Reaction_themeId_fkey`(`themeId`),
    INDEX `Reaction_galleryId_fkey`(`galleryId`),
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
    `icon` VARCHAR(256) NULL,
    `text` TEXT NOT NULL,
    `power` TEXT NOT NULL,
    `collection` VARCHAR(764) NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `label` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(764) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `rewardType` ENUM('SKILL', 'ITEM', 'TREASURE', 'TITLE', 'POWER', 'STORY') NOT NULL DEFAULT 'ITEM',

    INDEX `Reward_userId_fkey`(`userId`),
    INDEX `Reward_rewardType_idx`(`rewardType`),
    INDEX `Reward_rarity_idx`(`rarity`),
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
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
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
    `apiLink` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `apiKey` TEXT NULL,
    `designer` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NULL,
    `oidcProvider` VARCHAR(191) NULL,
    `useOidc` BOOLEAN NOT NULL DEFAULT false,
    `accessMode` ENUM('LOCAL', 'TAILSCALE', 'PUBLIC_PROTECTED', 'PUBLIC_API_KEY', 'PUBLIC_OIDC', 'PUBLIC_UNPROTECTED') NOT NULL DEFAULT 'LOCAL',
    `allowBrowserRequests` BOOLEAN NOT NULL DEFAULT true,
    `isPrivateNetwork` BOOLEAN NOT NULL DEFAULT false,
    `requiresClientSideCheck` BOOLEAN NOT NULL DEFAULT false,
    `backendBaseUrl` VARCHAR(191) NULL,
    `browserBaseUrl` VARCHAR(191) NULL,
    `defaultCfg` DOUBLE NULL,
    `defaultHeight` INTEGER NOT NULL DEFAULT 512,
    `defaultSampler` VARCHAR(191) NULL,
    `defaultScheduler` VARCHAR(191) NULL,
    `defaultSteps` INTEGER NULL,
    `defaultTransport` ENUM('BROWSER', 'BACKEND') NOT NULL DEFAULT 'BROWSER',
    `defaultWidth` INTEGER NOT NULL DEFAULT 512,
    `generationEngine` ENUM('A1111', 'COMFY', 'FLUX', 'KONTEXT', 'OPENAI_IMAGE', 'OTHER') NOT NULL DEFAULT 'A1111',
    `supportsBatch` BOOLEAN NOT NULL DEFAULT false,
    `supportsFlux` BOOLEAN NOT NULL DEFAULT false,
    `supportsImageEdit` BOOLEAN NOT NULL DEFAULT false,
    `supportsInpaint` BOOLEAN NOT NULL DEFAULT false,
    `supportsKontext` BOOLEAN NOT NULL DEFAULT false,
    `supportsOutpaint` BOOLEAN NOT NULL DEFAULT false,
    `supportsWorkflowUpload` BOOLEAN NOT NULL DEFAULT false,
    `workflowJson` LONGTEXT NULL,
    `workflowPath` VARCHAR(191) NULL,
    `workflowVersion` VARCHAR(191) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `artPrompt` TEXT NULL,

    INDEX `Server_serverType_idx`(`serverType`),
    INDEX `Server_isPublic_idx`(`isPublic`),
    INDEX `Server_userId_idx`(`userId`),
    INDEX `Server_accessMode_idx`(`accessMode`),
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
    `Role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER', 'CHILD') NOT NULL DEFAULT 'USER',
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

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
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
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Gallery_userId_fkey`(`userId`),
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
    `isPublic` BOOLEAN NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `Tag_artImageId_key`(`artImageId`),
    INDEX `Tag_userId_fkey`(`userId`),
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
CREATE TABLE `_ArtImageToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtImageToTag_AB_unique`(`A`, `B`),
    INDEX `_ArtImageToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtCollectionToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtCollectionToArtImage_AB_unique`(`A`, `B`),
    INDEX `_ArtCollectionToArtImage_B_index`(`B`)
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
CREATE TABLE `_ComponentToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ComponentToTag_AB_unique`(`A`, `B`),
    INDEX `_ComponentToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToReward_AB_unique`(`A`, `B`),
    INDEX `_DreamToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToTag_AB_unique`(`A`, `B`),
    INDEX `_DreamToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PitchToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PitchToTag_AB_unique`(`A`, `B`),
    INDEX `_PitchToTag_B_index`(`B`)
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
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Component` ADD CONSTRAINT `Component_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageToTag` ADD CONSTRAINT `_ArtImageToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageToTag` ADD CONSTRAINT `_ArtImageToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToTag` ADD CONSTRAINT `_DreamToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToTag` ADD CONSTRAINT `_DreamToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PitchToTag` ADD CONSTRAINT `_PitchToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Pitch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PitchToTag` ADD CONSTRAINT `_PitchToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

