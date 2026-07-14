-- Model Builder durable orchestration tables.
--
-- Additive only: four new CREATE TABLEs plus the internal run -> item ->
-- artifact/revision foreign keys (cascade on delete). No existing table is
-- altered or dropped. External references (userId, sourceId, artImageId,
-- targetId) are plain scalar columns with no foreign key — ownership is
-- enforced in the API layer — so these tables stay self-contained.

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
    `sourceSnapshot` JSON NULL,
    `recipeKey` VARCHAR(64) NOT NULL,
    `recipeVersion` VARCHAR(32) NULL,
    `selections` JSON NULL,
    `usageInfo` JSON NULL,
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
    `stageStatuses` JSON NOT NULL,
    `pitch` TEXT NULL,
    `fieldsDraft` TEXT NULL,
    `promptDraft` TEXT NULL,
    `relationshipDraft` JSON NULL,
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
    `workflow` JSON NULL,
    `format` VARCHAR(32) NULL,
    `artImageId` INTEGER NULL,
    `draftPath` TEXT NULL,
    `promotedPath` TEXT NULL,
    `reviewState` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `usageInfo` JSON NULL,

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
    `previousPayload` JSON NULL,
    `nextPayload` JSON NULL,
    `actor` VARCHAR(191) NULL,
    `reason` VARCHAR(255) NULL,

    INDEX `ModelBuildRevision_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ModelBuildItem` ADD CONSTRAINT `ModelBuildItem_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `ModelBuildRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelBuildArtifact` ADD CONSTRAINT `ModelBuildArtifact_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ModelBuildItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelBuildRevision` ADD CONSTRAINT `ModelBuildRevision_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ModelBuildItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
