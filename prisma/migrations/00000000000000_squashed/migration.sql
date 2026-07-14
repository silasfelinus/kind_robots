-- CreateTable
CREATE TABLE `FacetAlias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `facetId` INTEGER NOT NULL,
    `alias` VARCHAR(255) NOT NULL,
    `lookupKey` VARCHAR(255) NOT NULL,
    `isCanonical` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `FacetAlias_lookupKey_key`(`lookupKey`),
    INDEX `FacetAlias_facetId_idx`(`facetId`),
    INDEX `FacetAlias_isActive_idx`(`isActive`),
    UNIQUE INDEX `FacetAlias_facetId_alias_key`(`facetId`, `alias`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelBuildRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `userId` INTEGER NULL DEFAULT 10,
    `sourceType` VARCHAR(64) NOT NULL,
    `sourceId` INTEGER NOT NULL,
    `sourceLabel` VARCHAR(255) NULL,
    `sourceSnapshot` LONGTEXT NULL,
    `recipeKey` VARCHAR(64) NOT NULL,
    `recipeVersion` VARCHAR(32) NULL,
    `selections` LONGTEXT NULL,
    `usageInfo` LONGTEXT NULL,
    `cancelledAt` DATETIME(3) NULL,

    INDEX `ModelBuildRun_userId_idx`(`userId`),
    INDEX `ModelBuildRun_status_idx`(`status`),
    INDEX `ModelBuildRun_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelBuildItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `runId` INTEGER NOT NULL,
    `outputKey` VARCHAR(64) NOT NULL,
    `label` VARCHAR(255) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'ASSET_ONLY') NOT NULL DEFAULT 'ASSET_ONLY',
    `generation` VARCHAR(32) NOT NULL,
    `quantityIndex` INTEGER NOT NULL DEFAULT 0,
    `targetType` VARCHAR(64) NULL,
    `targetId` INTEGER NULL,
    `stageStatuses` LONGTEXT NOT NULL,
    `pitch` TEXT NULL,
    `fieldsDraft` TEXT NULL,
    `promptDraft` TEXT NULL,
    `relationshipDraft` LONGTEXT NULL,
    `staleReason` VARCHAR(255) NULL,
    `error` TEXT NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `artImageId` INTEGER NULL,

    UNIQUE INDEX `ModelBuildItem_idempotencyKey_key`(`idempotencyKey`),
    INDEX `ModelBuildItem_runId_idx`(`runId`),
    INDEX `ModelBuildItem_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelBuildArtifact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `itemId` INTEGER NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `provider` VARCHAR(64) NULL,
    `model` VARCHAR(191) NULL,
    `seed` VARCHAR(64) NULL,
    `prompt` TEXT NULL,
    `negativePrompt` TEXT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `workflow` LONGTEXT NULL,
    `format` VARCHAR(32) NULL,
    `artImageId` INTEGER NULL,
    `draftPath` TEXT NULL,
    `promotedPath` TEXT NULL,
    `reviewState` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `usageInfo` LONGTEXT NULL,

    INDEX `ModelBuildArtifact_itemId_idx`(`itemId`),
    INDEX `ModelBuildArtifact_reviewState_idx`(`reviewState`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelBuildRevision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `itemId` INTEGER NOT NULL,
    `stage` VARCHAR(48) NOT NULL,
    `previousPayload` LONGTEXT NULL,
    `nextPayload` LONGTEXT NULL,
    `actor` VARCHAR(191) NULL,
    `reason` VARCHAR(255) NULL,

    INDEX `ModelBuildRevision_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `isPublic` BOOLEAN NULL DEFAULT true,
    `negativePrompt` TEXT NULL,
    `path` VARCHAR(764) NULL,
    `promptString` TEXT NULL,
    `sampler` VARCHAR(764) NULL,
    `seed` INTEGER NULL DEFAULT -1,
    `serverId` INTEGER NULL,
    `serverName` VARCHAR(256) NULL,
    `serverUrl` VARCHAR(764) NULL,
    `steps` INTEGER NULL,
    `isActive` BOOLEAN NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `cardData` TEXT NULL,
    `cardPath` TEXT NULL,
    `heroData` TEXT NULL,
    `heroPath` TEXT NULL,
    `iconData` TEXT NULL,
    `iconPath` TEXT NULL,
    `thumbnailData` TEXT NULL,
    `thumbnailPath` TEXT NULL,

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
    `userId` INTEGER NULL DEFAULT 10,
    `label` VARCHAR(191) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `username` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,
    `slug` VARCHAR(255) NULL,
    `parentFolder` VARCHAR(512) NULL,

    UNIQUE INDEX `ArtCollection_slug_key`(`slug`),
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
    `imagePath` VARCHAR(764) NULL,
    `forgeIntro` TEXT NULL,
    `narrativeVoice` TEXT NULL,
    `slug` VARCHAR(255) NULL,
    `chatBorderImage` VARCHAR(764) NULL,

    UNIQUE INDEX `Bot_slug_key`(`slug`),
    INDEX `Bot_userId_fkey`(`userId`),
    INDEX `Bot_serverId_fkey`(`serverId`),
    INDEX `Bot_artImageId_fkey`(`artImageId`),
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
    `userId` INTEGER NULL DEFAULT 10,
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
    `slug` VARCHAR(255) NULL,

    UNIQUE INDEX `Character_slug_key`(`slug`),
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
    `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia', 'Dream', 'Reward', 'Story', 'Scenario', 'Character', 'Bot', 'Project') NOT NULL,
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
    `readAt` DATETIME(3) NULL,
    `projectId` INTEGER NULL,

    INDEX `Chat_serverId_fkey`(`serverId`),
    INDEX `Chat_botId_fkey`(`botId`),
    INDEX `Chat_characterId_fkey`(`characterId`),
    INDEX `Chat_promptId_fkey`(`promptId`),
    INDEX `Chat_userId_fkey`(`userId`),
    INDEX `Chat_dreamId_fkey`(`dreamId`),
    INDEX `Chat_projectId_fkey`(`projectId`),
    INDEX `Chat_artImageId_fkey`(`artImageId`),
    INDEX `Chat_originId_createdAt_idx`(`originId`, `createdAt`),
    INDEX `Chat_recipientId_idx`(`recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL DEFAULT 10,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `graph` LONGTEXT NOT NULL,
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
    `userId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(764) NULL,
    `approvedAt` DATETIME(3) NULL,
    `bountyId` INTEGER NULL,
    `manaCharged` INTEGER NULL,
    `outputDreamId` INTEGER NULL,
    `status` ENUM('DRAFT', 'PENDING', 'RUNNING', 'DONE', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `stepLog` LONGTEXT NULL,
    `userApproved` BOOLEAN NOT NULL DEFAULT false,
    `wishText` TEXT NULL,

    UNIQUE INDEX `Composition_artImageId_key`(`artImageId`),
    UNIQUE INDEX `Composition_outputDreamId_key`(`outputDreamId`),
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
    `description` TEXT NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `artImageId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `designer` VARCHAR(256) NULL,
    `dreamType` ENUM('ART', 'BRAINSTORM', 'PROMPTBOT', 'NARRATOR', 'CHARACTER', 'REWARD', 'SCENARIO', 'LOCATION', 'PITCH', 'WISH') NOT NULL DEFAULT 'PITCH',
    `examples` LONGTEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `highlightImage` VARCHAR(256) NULL,
    `icon` VARCHAR(191) NULL,
    `imagePath` TEXT NULL,
    `pitch` TEXT NULL,
    `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    `cardPath` TEXT NULL,
    `heroPath` TEXT NULL,
    `narratorId` INTEGER NULL,

    UNIQUE INDEX `Dream_slug_key`(`slug`),
    INDEX `Dream_artImageId_fkey`(`artImageId`),
    INDEX `Dream_userId_idx`(`userId`),
    INDEX `Dream_dreamType_idx`(`dreamType`),
    INDEX `Dream_isPublic_idx`(`isPublic`),
    INDEX `Dream_isActive_idx`(`isActive`),
    INDEX `Dream_artCollectionId_idx`(`artCollectionId`),
    INDEX `Dream_narratorId_idx`(`narratorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DreamRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromDreamId` INTEGER NOT NULL,
    `toDreamId` INTEGER NOT NULL,
    `relationType` ENUM('IS_A', 'APPEARS_IN', 'CONTAINS', 'RELATED', 'INSPIRED_BY') NOT NULL DEFAULT 'RELATED',
    `note` VARCHAR(512) NULL,

    INDEX `DreamRelation_fromDreamId_idx`(`fromDreamId`),
    INDEX `DreamRelation_toDreamId_idx`(`toDreamId`),
    INDEX `DreamRelation_relationType_idx`(`relationType`),
    UNIQUE INDEX `DreamRelation_fromDreamId_toDreamId_relationType_key`(`fromDreamId`, `toDreamId`, `relationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `pitch` TEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `goal` TEXT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED', 'BRAINSTORM') NOT NULL DEFAULT 'BRAINSTORM',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL DEFAULT 'NORMAL',
    `conductorSlug` VARCHAR(255) NULL,
    `repoUrl` VARCHAR(512) NULL,
    `liveUrl` VARCHAR(512) NULL,
    `channelKey` VARCHAR(255) NULL,
    `tabKey` VARCHAR(255) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    `highlightImage` VARCHAR(256) NULL,
    `icon` VARCHAR(191) NULL,
    `imagePath` TEXT NULL,
    `cardPath` TEXT NULL,
    `heroPath` TEXT NULL,
    `designer` VARCHAR(256) NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `userId` INTEGER NULL DEFAULT 10,
    `managerBotId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    UNIQUE INDEX `Project_conductorSlug_key`(`conductorSlug`),
    INDEX `Project_userId_idx`(`userId`),
    INDEX `Project_managerBotId_idx`(`managerBotId`),
    INDEX `Project_artImageId_idx`(`artImageId`),
    INDEX `Project_artCollectionId_idx`(`artCollectionId`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_priority_idx`(`priority`),
    INDEX `Project_channelKey_tabKey_idx`(`channelKey`, `tabKey`),
    INDEX `Project_isPublic_idx`(`isPublic`),
    INDEX `Project_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Facet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `kind` ENUM('GENRE', 'ANIMAL', 'COLOR', 'THEME', 'CORE', 'MOOD', 'STYLE', 'SETTING', 'ART_DIRECTION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `description` TEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `examples` LONGTEXT NULL,
    `artPrompt` TEXT NULL,
    `imagePath` TEXT NULL,
    `cardPath` TEXT NULL,
    `heroPath` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `designer` VARCHAR(256) NULL,
    `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    `userId` INTEGER NULL DEFAULT 10,
    `artImageId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Facet_slug_key`(`slug`),
    INDEX `Facet_userId_idx`(`userId`),
    INDEX `Facet_kind_idx`(`kind`),
    INDEX `Facet_artImageId_idx`(`artImageId`),
    INDEX `Facet_artCollectionId_idx`(`artCollectionId`),
    INDEX `Facet_isPublic_idx`(`isPublic`),
    INDEX `Facet_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DreamFacet` (
    `dreamId` INTEGER NOT NULL,
    `facetId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DreamFacet_facetId_idx`(`facetId`),
    PRIMARY KEY (`dreamId`, `facetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScenarioFacet` (
    `scenarioId` INTEGER NOT NULL,
    `facetId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScenarioFacet_facetId_idx`(`facetId`),
    PRIMARY KEY (`scenarioId`, `facetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectArtImage` (
    `projectId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectArtImage_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`projectId`, `artImageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectArtCollection` (
    `projectId` INTEGER NOT NULL,
    `artCollectionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectArtCollection_artCollectionId_idx`(`artCollectionId`),
    PRIMARY KEY (`projectId`, `artCollectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacetArtImage` (
    `facetId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FacetArtImage_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`facetId`, `artImageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacetArtCollection` (
    `facetId` INTEGER NOT NULL,
    `artCollectionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FacetArtCollection_artCollectionId_idx`(`artCollectionId`),
    PRIMARY KEY (`facetId`, `artCollectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacetRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromFacetId` INTEGER NOT NULL,
    `toFacetId` INTEGER NOT NULL,
    `relationType` ENUM('IS_A', 'APPEARS_IN', 'CONTAINS', 'RELATED', 'INSPIRED_BY') NOT NULL DEFAULT 'RELATED',
    `note` VARCHAR(512) NULL,

    INDEX `FacetRelation_fromFacetId_idx`(`fromFacetId`),
    INDEX `FacetRelation_toFacetId_idx`(`toFacetId`),
    INDEX `FacetRelation_relationType_idx`(`relationType`),
    UNIQUE INDEX `FacetRelation_fromFacetId_toFacetId_relationType_key`(`fromFacetId`, `toFacetId`, `relationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpressionMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expression` ENUM('NEUTRAL', 'JOYFUL', 'SORROWFUL', 'AFRAID', 'DISGUSTED', 'ENRAGED', 'SURPRISED', 'ANXIOUS', 'PROUD', 'LOVING', 'LAUGHING', 'CRYING', 'SLEEPING', 'THINKING', 'SHRUGGING', 'WINKING', 'FACEPALMING', 'CHEERING', 'WHISPERING', 'SHOUTING', 'CUSTOM') NOT NULL DEFAULT 'NEUTRAL',
    `kind` ENUM('EMOTION', 'ACTION') NOT NULL DEFAULT 'EMOTION',
    `label` VARCHAR(256) NULL,
    `emoticon` VARCHAR(32) NULL,
    `expressionKey` VARCHAR(128) NOT NULL,
    `imagePath` VARCHAR(764) NULL,
    `videoPath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `message` TEXT NULL,
    `additionalPhrases` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `ExpressionMedia_artImageId_key`(`artImageId`),
    INDEX `ExpressionMedia_artImageId_idx`(`artImageId`),
    INDEX `ExpressionMedia_botId_idx`(`botId`),
    INDEX `ExpressionMedia_characterId_idx`(`characterId`),
    INDEX `ExpressionMedia_kind_idx`(`kind`),
    INDEX `ExpressionMedia_expressionKey_idx`(`expressionKey`),
    INDEX `ExpressionMedia_botId_kind_idx`(`botId`, `kind`),
    INDEX `ExpressionMedia_characterId_kind_idx`(`characterId`, `kind`),
    INDEX `ExpressionMedia_botId_isActive_idx`(`botId`, `isActive`),
    INDEX `ExpressionMedia_characterId_isActive_idx`(`characterId`, `isActive`),
    UNIQUE INDEX `ExpressionMedia_botId_expressionKey_key`(`botId`, `expressionKey`),
    UNIQUE INDEX `ExpressionMedia_characterId_expressionKey_key`(`characterId`, `expressionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpressionTransition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromKey` VARCHAR(128) NOT NULL,
    `toKey` VARCHAR(128) NOT NULL,
    `videoPath` VARCHAR(764) NOT NULL,
    `fps` INTEGER NOT NULL DEFAULT 16,
    `frames` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,

    INDEX `ExpressionTransition_botId_idx`(`botId`),
    INDEX `ExpressionTransition_characterId_idx`(`characterId`),
    INDEX `ExpressionTransition_botId_fromKey_idx`(`botId`, `fromKey`),
    INDEX `ExpressionTransition_characterId_fromKey_idx`(`characterId`, `fromKey`),
    INDEX `ExpressionTransition_isActive_idx`(`isActive`),
    UNIQUE INDEX `ExpressionTransition_botId_fromKey_toKey_key`(`botId`, `fromKey`, `toKey`),
    UNIQUE INDEX `ExpressionTransition_characterId_fromKey_toKey_key`(`characterId`, `fromKey`, `toKey`),
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
CREATE TABLE `Achievement` (
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

    UNIQUE INDEX `Milestone_triggerCode_key`(`triggerCode`(255)),
    INDEX `Achievement_artImageId_fkey`(`artImageId`),
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
CREATE TABLE `AchievementRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `username` VARCHAR(764) NULL,
    `achievementId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `isConfirmed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `AchievementRecord_achievementId_fkey`(`achievementId`),
    INDEX `AchievementRecord_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NarratorTopic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(764) NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(255) NULL,
    `prompt` TEXT NOT NULL,
    `sampleUserPrompt` VARCHAR(764) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `NarratorTopic_slug_key`(`slug`),
    INDEX `NarratorTopic_sortOrder_idx`(`sortOrder`),
    INDEX `NarratorTopic_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NarratorThread` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `botId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `openingText` TEXT NOT NULL,
    `guidance` TEXT NULL,
    `starterPrompts` LONGTEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `NarratorThread_botId_idx`(`botId`),
    INDEX `NarratorThread_topicId_idx`(`topicId`),
    INDEX `NarratorThread_sortOrder_idx`(`sortOrder`),
    INDEX `NarratorThread_isActive_idx`(`isActive`),
    UNIQUE INDEX `NarratorThread_botId_topicId_key`(`botId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PitchSheet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dreamId` INTEGER NULL,
    `layoutKey` VARCHAR(128) NOT NULL DEFAULT 'pitch-card',
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(512) NULL,
    `hook` VARCHAR(512) NULL,
    `pitch` TEXT NULL,
    `highlight1Label` VARCHAR(128) NULL,
    `highlight1Value` VARCHAR(512) NULL,
    `highlight1Icon` VARCHAR(255) NULL,
    `highlight2Label` VARCHAR(128) NULL,
    `highlight2Value` VARCHAR(512) NULL,
    `highlight2Icon` VARCHAR(255) NULL,
    `highlight3Label` VARCHAR(128) NULL,
    `highlight3Value` VARCHAR(512) NULL,
    `highlight3Icon` VARCHAR(255) NULL,
    `detail1Label` VARCHAR(128) NULL,
    `detail1Body` TEXT NULL,
    `detail2Label` VARCHAR(128) NULL,
    `detail2Body` TEXT NULL,
    `detail3Label` VARCHAR(128) NULL,
    `detail3Body` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `icon` VARCHAR(255) NULL,
    `colorTheme` VARCHAR(255) NULL,
    `extraData` LONGTEXT NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `designer` VARCHAR(255) NULL DEFAULT 'system',
    `projectId` INTEGER NULL,

    UNIQUE INDEX `PitchSheet_dreamId_key`(`dreamId`),
    UNIQUE INDEX `PitchSheet_projectId_key`(`projectId`),
    INDEX `PitchSheet_layoutKey_idx`(`layoutKey`),
    INDEX `PitchSheet_projectId_idx`(`projectId`),
    INDEX `PitchSheet_artImageId_idx`(`artImageId`),
    INDEX `PitchSheet_userId_idx`(`userId`),
    INDEX `PitchSheet_isPublic_idx`(`isPublic`),
    INDEX `PitchSheet_isActive_idx`(`isActive`),
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
    `serverId` INTEGER NULL,
    `artStatus` ENUM('PENDING', 'QUEUED', 'GENERATING', 'DONE', 'FAILED', 'CANCELLED') NULL,
    `batchId` VARCHAR(191) NULL,
    `batchIndex` INTEGER NULL,
    `queuePosition` INTEGER NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `notifiedAt` DATETIME(3) NULL,
    `isBounty` BOOLEAN NOT NULL DEFAULT false,
    `bountyStatus` ENUM('OPEN', 'CLAIMED', 'FULFILLED', 'EXPIRED', 'CANCELLED') NULL,
    `claimerId` INTEGER NULL,

    INDEX `Prompt_userId_fkey`(`userId`),
    INDEX `Prompt_artImageId_fkey`(`artImageId`),
    INDEX `Prompt_botId_fkey`(`botId`),
    INDEX `Prompt_serverId_idx`(`serverId`),
    INDEX `Prompt_claimerId_idx`(`claimerId`),
    INDEX `Prompt_artStatus_idx`(`artStatus`),
    INDEX `Prompt_batchId_idx`(`batchId`),
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
    `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHALLENGE_SUBMISSION', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'COMPOSITION', 'DREAM', 'FACET', 'PROJECT', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE',
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
    `challengeSubmissionId` INTEGER NULL,
    `projectId` INTEGER NULL,
    `facetId` INTEGER NULL,

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
    INDEX `Reaction_projectId_fkey`(`projectId`),
    INDEX `Reaction_facetId_fkey`(`facetId`),
    INDEX `Reaction_promptId_fkey`(`promptId`),
    INDEX `Reaction_resourceId_fkey`(`resourceId`),
    INDEX `Reaction_rewardId_fkey`(`rewardId`),
    INDEX `Reaction_scenarioId_fkey`(`scenarioId`),
    INDEX `Reaction_themeId_fkey`(`themeId`),
    INDEX `Reaction_compositionId_idx`(`compositionId`),
    INDEX `Reaction_challengeSubmissionId_idx`(`challengeSubmissionId`),
    UNIQUE INDEX `Reaction_userId_challengeSubmissionId_key`(`userId`, `challengeSubmissionId`),
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
    `imagePath` VARCHAR(191) NULL,
    `slug` VARCHAR(255) NULL,

    UNIQUE INDEX `Resource_id_key`(`name`(200)),
    UNIQUE INDEX `Resource_slug_key`(`slug`),
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
    `collection` VARCHAR(764) NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `userId` INTEGER NULL DEFAULT 1,
    `artImageId` INTEGER NULL,
    `imagePath` VARCHAR(764) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `artPrompt` TEXT NULL,
    `rewardType` ENUM('SKILL', 'ITEM', 'POWER', 'PET', 'MAGIC', 'FAVOR') NOT NULL DEFAULT 'ITEM',
    `description` TEXT NULL,
    `effect` TEXT NULL,
    `flavorText` VARCHAR(512) NULL,
    `name` VARCHAR(256) NOT NULL,
    `slug` VARCHAR(256) NULL,

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
    `userId` INTEGER NULL,
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
    `group` VARCHAR(191) NULL,
    `secretNotes` VARCHAR(191) NULL,
    `tier` VARCHAR(191) NULL,
    `cast` LONGTEXT NULL,
    `outputType` ENUM('STORY', 'ART', 'CHARACTER', 'REWARD', 'DREAM', 'SCENARIO', 'MIXED') NOT NULL DEFAULT 'STORY',
    `slug` VARCHAR(255) NULL,

    UNIQUE INDEX `Scenario_slug_key`(`slug`),
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
    `serverType` ENUM('A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `category` VARCHAR(191) NULL,
    `baseUrl` VARCHAR(764) NULL,
    `endpointPath` VARCHAR(512) NULL,
    `healthPath` VARCHAR(512) NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isEditable` BOOLEAN NOT NULL DEFAULT true,
    `apiKeyName` VARCHAR(255) NULL,
    `apiLink` VARCHAR(764) NULL,
    `model` VARCHAR(255) NULL,
    `apiKey` TEXT NULL,
    `designer` VARCHAR(255) NULL,
    `version` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `accessMode` ENUM('BROWSER', 'BACKEND', 'TAILSCALE', 'PUBLIC', 'LOCAL') NOT NULL DEFAULT 'BROWSER',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `artPrompt` TEXT NULL,
    `authType` ENUM('NONE', 'BEARER', 'HEADER', 'QUERY', 'API_KEY') NOT NULL DEFAULT 'NONE',

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
CREATE TABLE `ServerHealthCheck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `serverId` INTEGER NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `ok` BOOLEAN NOT NULL DEFAULT false,
    `latencyMs` INTEGER NULL,
    `source` VARCHAR(32) NOT NULL DEFAULT 'server',
    `note` TEXT NULL,

    INDEX `ServerHealthCheck_serverId_checkedAt_idx`(`serverId`, `checkedAt`),
    INDEX `ServerHealthCheck_checkedAt_idx`(`checkedAt`),
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
CREATE TABLE `SocialPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `designer` VARCHAR(256) NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `mediaUrls` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `sourceType` VARCHAR(191) NULL,
    `sourceId` INTEGER NULL,
    `scheduledAt` DATETIME(3) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `audience` ENUM('PUBLIC', 'SOCIAL', 'WORK', 'FRIENDS', 'FAMILY', 'PRIVATE') NOT NULL DEFAULT 'SOCIAL',

    INDEX `SocialPost_userId_idx`(`userId`),
    INDEX `SocialPost_status_idx`(`status`),
    INDEX `SocialPost_audience_idx`(`audience`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialTarget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `platform` ENUM('DISCORD', 'MASTODON', 'BLUESKY', 'REDDIT', 'FACEBOOK', 'INSTAGRAM', 'RSS') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'COPIED') NOT NULL DEFAULT 'PENDING',
    `remoteId` VARCHAR(191) NULL,
    `remoteUrl` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,

    INDEX `SocialTarget_postId_idx`(`postId`),
    INDEX `SocialTarget_platform_idx`(`platform`),
    INDEX `SocialTarget_status_idx`(`status`),
    UNIQUE INDEX `SocialTarget_postId_platform_key`(`postId`, `platform`),
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
    `isGuest` BOOLEAN NOT NULL DEFAULT false,
    `lastManaRefill` DATETIME(3) NULL,
    `manaCap` INTEGER NOT NULL DEFAULT 500,
    `signupBonusGiven` BOOLEAN NOT NULL DEFAULT false,
    `referralCode` VARCHAR(64) NULL,
    `allowFriendRequests` BOOLEAN NOT NULL DEFAULT true,
    `brevoContactId` VARCHAR(64) NULL,
    `isRestricted` BOOLEAN NOT NULL DEFAULT false,
    `listInDirectory` BOOLEAN NOT NULL DEFAULT true,
    `messagePolicy` ENUM('EVERYONE', 'FRIENDS', 'NONE') NOT NULL DEFAULT 'EVERYONE',
    `newsletterConfirmedAt` DATETIME(3) NULL,
    `newsletterFrequency` ENUM('NEVER', 'SPECIAL', 'MONTHLY', 'WEEKLY', 'DAILY') NOT NULL DEFAULT 'NEVER',
    `restrictedAt` DATETIME(3) NULL,
    `restrictedById` INTEGER NULL,
    `restrictedReason` TEXT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_referralCode_key`(`referralCode`),
    INDEX `User_artImageId_fkey`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StylistClient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,

    INDEX `StylistClient_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StylistAppointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `clientId` INTEGER NULL,
    `clientName` VARCHAR(255) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `hourlyRateCents` INTEGER NOT NULL DEFAULT 0,
    `minutes` INTEGER NOT NULL DEFAULT 0,
    `productCostCents` INTEGER NOT NULL DEFAULT 0,
    `totalCents` INTEGER NOT NULL DEFAULT 0,

    INDEX `StylistAppointment_userId_idx`(`userId`),
    INDEX `StylistAppointment_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `engine` ENUM('A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM') NOT NULL DEFAULT 'A1111',
    `payload` LONGTEXT NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `claimedAt` DATETIME(3) NULL,
    `claimedBy` VARCHAR(255) NULL,
    `projectSlug` VARCHAR(255) NULL,
    `artImageId` INTEGER NULL,
    `error` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `projectId` INTEGER NULL,

    INDEX `ArtJob_status_priority_id_idx`(`status`, `priority`, `id`),
    INDEX `ArtJob_userId_idx`(`userId`),
    INDEX `ArtJob_projectSlug_idx`(`projectSlug`),
    INDEX `ArtJob_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KarmaTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` ENUM('REACTION_GIVEN', 'REACTION_RECEIVED', 'CONTENT_CREATED_PUBLIC', 'CONTENT_SHARED', 'GENERATION_COMPLETED', 'BOUNTY_POSTED', 'BOUNTY_FULFILLED', 'BOUNTY_CLAIMED', 'REFERRAL_SIGNUP', 'REFERRAL_CUT', 'ADMIN_ADJUSTMENT') NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `refId` VARCHAR(191) NULL,
    `note` TEXT NULL,

    INDEX `KarmaTransaction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referrerId` INTEGER NOT NULL,
    `referredId` INTEGER NOT NULL,
    `codeUsed` VARCHAR(64) NULL,
    `cutRate` DOUBLE NOT NULL DEFAULT 0.05,

    UNIQUE INDEX `Referral_referredId_key`(`referredId`),
    INDEX `Referral_referrerId_idx`(`referrerId`),
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
CREATE TABLE `Todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(512) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('OPEN', 'DONE', 'ARCHIVED') NOT NULL DEFAULT 'OPEN',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL DEFAULT 'NORMAL',
    `category` ENUM('AGENT', 'KAIZEN', 'HONEYDO', 'DESIRED_FEATURE') NOT NULL DEFAULT 'AGENT',
    `dueDate` DATETIME(3) NULL,
    `icon` VARCHAR(128) NULL,
    `imagePath` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `dreamId` INTEGER NULL,
    `order` INTEGER NULL,
    `projectId` INTEGER NULL,

    INDEX `Todo_userId_idx`(`userId`),
    INDEX `Todo_dreamId_idx`(`dreamId`),
    INDEX `Todo_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Challenge` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(764) NOT NULL,
    `challengeType` ENUM('ART', 'TEXT', 'CHARACTER', 'SCENARIO', 'REASONING') NOT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `promptText` TEXT NOT NULL,
    `judgeNotes` TEXT NULL,
    `status` ENUM('OPEN', 'JUDGING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL DEFAULT 10,

    UNIQUE INDEX `Challenge_slug_key`(`slug`),
    INDEX `Challenge_userId_fkey`(`userId`),
    INDEX `Challenge_status_idx`(`status`),
    INDEX `Challenge_challengeType_idx`(`challengeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChallengeSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `challengeId` INTEGER NOT NULL,
    `botId` INTEGER NULL,
    `agentModel` VARCHAR(256) NULL,
    `outputText` TEXT NULL,
    `artImageId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `status` ENUM('PENDING', 'READY', 'DISQUALIFIED') NOT NULL DEFAULT 'READY',
    `contenderId` INTEGER NULL,
    `variantKey` VARCHAR(128) NOT NULL DEFAULT 'default',
    `promptUsed` TEXT NULL,
    `settings` LONGTEXT NULL,
    `randomSelections` LONGTEXT NULL,

    INDEX `ChallengeSubmission_botId_fkey`(`botId`),
    INDEX `ChallengeSubmission_contenderId_fkey`(`contenderId`),
    INDEX `ChallengeSubmission_artImageId_fkey`(`artImageId`),
    INDEX `ChallengeSubmission_characterId_fkey`(`characterId`),
    INDEX `ChallengeSubmission_scenarioId_fkey`(`scenarioId`),
    UNIQUE INDEX `ChallengeSubmission_challengeId_contenderId_variantKey_key`(`challengeId`, `contenderId`, `variantKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contender` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `kind` ENUM('AGENT_STACK', 'LLM_MODEL', 'ART_GENERATOR') NOT NULL,
    `provider` VARCHAR(128) NULL,
    `model` VARCHAR(255) NULL,
    `generator` VARCHAR(128) NULL,
    `defaultSettings` LONGTEXT NULL,
    `description` TEXT NULL,
    `avatarImageId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Contender_slug_key`(`slug`),
    INDEX `Contender_kind_idx`(`kind`),
    INDEX `Contender_provider_idx`(`provider`),
    INDEX `Contender_model_idx`(`model`),
    INDEX `Contender_generator_idx`(`generator`),
    INDEX `Contender_isActive_idx`(`isActive`),
    INDEX `Contender_avatarImageId_fkey`(`avatarImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETE', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `seed` VARCHAR(255) NOT NULL,
    `protagonistName` VARCHAR(255) NULL,
    `currentAge` INTEGER NULL,
    `currentChapter` INTEGER NOT NULL DEFAULT 1,
    `genre` VARCHAR(255) NULL,
    `dreamId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `botId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `endingId` INTEGER NULL,
    `outcomeKey` VARCHAR(16) NULL,
    `summary` TEXT NULL,
    `statsSnapshot` LONGTEXT NULL,

    INDEX `LifeRun_userId_idx`(`userId`),
    INDEX `LifeRun_status_idx`(`status`),
    INDEX `LifeRun_dreamId_idx`(`dreamId`),
    INDEX `LifeRun_characterId_idx`(`characterId`),
    INDEX `LifeRun_botId_idx`(`botId`),
    INDEX `LifeRun_artCollectionId_idx`(`artCollectionId`),
    INDEX `LifeRun_endingId_idx`(`endingId`),
    INDEX `LifeRun_outcomeKey_idx`(`outcomeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lifeRunId` INTEGER NOT NULL,
    `chatId` INTEGER NULL,
    `chapter` INTEGER NOT NULL,
    `prompt` TEXT NOT NULL,
    `choiceText` TEXT NOT NULL,
    `resultText` TEXT NULL,
    `effects` LONGTEXT NULL,

    INDEX `LifeChoice_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeChoice_chatId_idx`(`chatId`),
    INDEX `LifeChoice_chapter_idx`(`chapter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeStat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lifeRunId` INTEGER NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    INDEX `LifeStat_key_idx`(`key`),
    UNIQUE INDEX `LifeStat_lifeRunId_key_key`(`lifeRunId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeEnding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `outcomeKey` VARCHAR(16) NOT NULL,
    `summary` TEXT NOT NULL,
    `victoryType` ENUM('VICTORY', 'FAILURE', 'MIXED', 'SECRET') NOT NULL DEFAULT 'MIXED',
    `icon` VARCHAR(764) NULL,
    `heroImage` VARCHAR(764) NULL,
    `iconArtImageId` INTEGER NULL,
    `heroArtImageId` INTEGER NULL,
    `achievementId` INTEGER NULL,
    `artPrompt` TEXT NULL,
    `metadata` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LifeEnding_slug_key`(`slug`),
    UNIQUE INDEX `LifeEnding_outcomeKey_key`(`outcomeKey`),
    INDEX `LifeEnding_victoryType_idx`(`victoryType`),
    INDEX `LifeEnding_achievementId_idx`(`achievementId`),
    INDEX `LifeEnding_iconArtImageId_idx`(`iconArtImageId`),
    INDEX `LifeEnding_heroArtImageId_idx`(`heroArtImageId`),
    INDEX `LifeEnding_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeAchievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `achievementType` ENUM('CHOICE', 'CHAPTER', 'STAT_THRESHOLD', 'ENDING', 'SECRET', 'FAILURE', 'VICTORY', 'COLLECTION') NOT NULL,
    `conditionKey` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(764) NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `achievementId` INTEGER NULL,
    `endingId` INTEGER NULL,
    `metadata` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LifeAchievement_slug_key`(`slug`),
    INDEX `LifeAchievement_achievementType_idx`(`achievementType`),
    INDEX `LifeAchievement_conditionKey_idx`(`conditionKey`),
    INDEX `LifeAchievement_artImageId_idx`(`artImageId`),
    INDEX `LifeAchievement_achievementId_idx`(`achievementId`),
    INDEX `LifeAchievement_endingId_idx`(`endingId`),
    INDEX `LifeAchievement_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeAchievementUnlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `lifeRunId` INTEGER NULL,
    `achievementId` INTEGER NOT NULL,
    `achievementRecordId` INTEGER NULL,
    `data` LONGTEXT NULL,

    INDEX `LifeAchievementUnlock_userId_idx`(`userId`),
    INDEX `LifeAchievementUnlock_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeAchievementUnlock_achievementId_idx`(`achievementId`),
    INDEX `LifeAchievementUnlock_achievementRecordId_idx`(`achievementRecordId`),
    UNIQUE INDEX `LifeAchievementUnlock_userId_achievementId_lifeRunId_key`(`userId`, `achievementId`, `lifeRunId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeRunArt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lifeRunId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `chapter` INTEGER NULL,
    `sceneType` ENUM('MOMENT', 'DREAM', 'CHARACTER', 'CHOICE', 'THRESHOLD', 'ENDING', 'ICON', 'HERO') NOT NULL DEFAULT 'MOMENT',
    `prompt` TEXT NOT NULL,

    INDEX `LifeRunArt_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeRunArt_artImageId_idx`(`artImageId`),
    INDEX `LifeRunArt_sceneType_idx`(`sceneType`),
    INDEX `LifeRunArt_chapter_idx`(`chapter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(128) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'NEWSLETTER_CONFIRM') NOT NULL,
    `consumedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AuthToken_token_key`(`token`),
    INDEX `AuthToken_userId_idx`(`userId`),
    INDEX `AuthToken_purpose_idx`(`purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(255) NULL,
    `lastMessageAt` DATETIME(3) NULL,

    INDEX `Conversation_lastMessageAt_idx`(`lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastReadAt` DATETIME(3) NULL,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ConversationParticipant_userId_idx`(`userId`),
    UNIQUE INDEX `ConversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DirectMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `conversationId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `DirectMessage_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `DirectMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `type` ENUM('MESSAGE', 'FRIEND_REQUEST', 'FRIEND_ACCEPT', 'ADMIN', 'SYSTEM') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `linkPath` VARCHAR(512) NULL,
    `actorId` INTEGER NULL,
    `entityId` INTEGER NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `Notification_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtImageLoraResources` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtImageLoraResources_AB_unique`(`A`, `B`),
    INDEX `_ArtImageLoraResources_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtImage_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtCollectionToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtCollectionToArtImage_AB_unique`(`A`, `B`),
    INDEX `_ArtCollectionToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToArtCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtCollection_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtCollection_B_index`(`B`)
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
CREATE TABLE `_DreamToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToReward_AB_unique`(`A`, `B`),
    INDEX `_DreamToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToScenario` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToScenario_AB_unique`(`A`, `B`),
    INDEX `_DreamToScenario_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ResourceToServer` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ResourceToServer_AB_unique`(`A`, `B`),
    INDEX `_ResourceToServer_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FacetAlias` ADD CONSTRAINT `FacetAlias_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelBuildItem` ADD CONSTRAINT `ModelBuildItem_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `ModelBuildRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelBuildArtifact` ADD CONSTRAINT `ModelBuildArtifact_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ModelBuildItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelBuildRevision` ADD CONSTRAINT `ModelBuildRevision_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ModelBuildItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_checkpointResourceId_fkey` FOREIGN KEY (`checkpointResourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtCollection` ADD CONSTRAINT `ArtCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Code` ADD CONSTRAINT `Code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Component` ADD CONSTRAINT `Component_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_outputDreamId_fkey` FOREIGN KEY (`outputDreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_narratorId_fkey` FOREIGN KEY (`narratorId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DreamRelation` ADD CONSTRAINT `DreamRelation_fromDreamId_fkey` FOREIGN KEY (`fromDreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DreamRelation` ADD CONSTRAINT `DreamRelation_toDreamId_fkey` FOREIGN KEY (`toDreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_managerBotId_fkey` FOREIGN KEY (`managerBotId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DreamFacet` ADD CONSTRAINT `DreamFacet_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DreamFacet` ADD CONSTRAINT `DreamFacet_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioFacet` ADD CONSTRAINT `ScenarioFacet_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioFacet` ADD CONSTRAINT `ScenarioFacet_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectArtImage` ADD CONSTRAINT `ProjectArtImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectArtImage` ADD CONSTRAINT `ProjectArtImage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectArtCollection` ADD CONSTRAINT `ProjectArtCollection_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectArtCollection` ADD CONSTRAINT `ProjectArtCollection_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetArtImage` ADD CONSTRAINT `FacetArtImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetArtImage` ADD CONSTRAINT `FacetArtImage_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetArtCollection` ADD CONSTRAINT `FacetArtCollection_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetArtCollection` ADD CONSTRAINT `FacetArtCollection_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetRelation` ADD CONSTRAINT `FacetRelation_fromFacetId_fkey` FOREIGN KEY (`fromFacetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacetRelation` ADD CONSTRAINT `FacetRelation_toFacetId_fkey` FOREIGN KEY (`toFacetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionTransition` ADD CONSTRAINT `ExpressionTransition_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionTransition` ADD CONSTRAINT `ExpressionTransition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Achievement` ADD CONSTRAINT `Achievement_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManaTransaction` ADD CONSTRAINT `ManaTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AchievementRecord` ADD CONSTRAINT `AchievementRecord_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AchievementRecord` ADD CONSTRAINT `AchievementRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NarratorThread` ADD CONSTRAINT `NarratorThread_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NarratorThread` ADD CONSTRAINT `NarratorThread_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `NarratorTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_claimerId_fkey` FOREIGN KEY (`claimerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_challengeSubmissionId_fkey` FOREIGN KEY (`challengeSubmissionId`) REFERENCES `ChallengeSubmission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `Scenario` ADD CONSTRAINT `Scenario_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Server` ADD CONSTRAINT `Server_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServerHealthCheck` ADD CONSTRAINT `ServerHealthCheck_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartIcon` ADD CONSTRAINT `SmartIcon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialTarget` ADD CONSTRAINT `SocialTarget_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `SocialPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Theme` ADD CONSTRAINT `Theme_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StylistClient` ADD CONSTRAINT `StylistClient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StylistAppointment` ADD CONSTRAINT `StylistAppointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `StylistClient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StylistAppointment` ADD CONSTRAINT `StylistAppointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtJob` ADD CONSTRAINT `ArtJob_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtJob` ADD CONSTRAINT `ArtJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KarmaTransaction` ADD CONSTRAINT `KarmaTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_relatedUserId_fkey` FOREIGN KEY (`relatedUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Challenge` ADD CONSTRAINT `Challenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `Challenge`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_contenderId_fkey` FOREIGN KEY (`contenderId`) REFERENCES `Contender`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contender` ADD CONSTRAINT `Contender_avatarImageId_fkey` FOREIGN KEY (`avatarImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_endingId_fkey` FOREIGN KEY (`endingId`) REFERENCES `LifeEnding`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeChoice` ADD CONSTRAINT `LifeChoice_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeChoice` ADD CONSTRAINT `LifeChoice_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeStat` ADD CONSTRAINT `LifeStat_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_heroArtImageId_fkey` FOREIGN KEY (`heroArtImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_iconArtImageId_fkey` FOREIGN KEY (`iconArtImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_endingId_fkey` FOREIGN KEY (`endingId`) REFERENCES `LifeEnding`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `LifeAchievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_achievementRecordId_fkey` FOREIGN KEY (`achievementRecordId`) REFERENCES `AchievementRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRunArt` ADD CONSTRAINT `LifeRunArt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRunArt` ADD CONSTRAINT `LifeRunArt_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
