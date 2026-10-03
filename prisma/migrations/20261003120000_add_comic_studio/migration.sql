-- CreateTable
CREATE TABLE `ComicSeries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `notes` LONGTEXT NULL,
    `styleProse` TEXT NULL,
    `styleTags` TEXT NULL,
    `negativeTags` TEXT NULL,
    `lanes` LONGTEXT NOT NULL,
    `isPublicArt` BOOLEAN NOT NULL DEFAULT false,
    `coverAttemptId` INTEGER NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `ComicSeries_slug_key`(`slug`),
    INDEX `ComicSeries_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComicEntity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seriesId` INTEGER NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `kind` VARCHAR(32) NOT NULL DEFAULT 'character',
    `name` VARCHAR(255) NOT NULL,
    `notes` LONGTEXT NULL,
    `secretUntil` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `portraitAttemptId` INTEGER NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ComicEntity_seriesId_sortOrder_idx`(`seriesId`, `sortOrder`),
    UNIQUE INDEX `ComicEntity_seriesId_key_key`(`seriesId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComicSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seriesId` INTEGER NOT NULL,
    `entityId` INTEGER NULL,
    `issueId` INTEGER NULL,
    `key` VARCHAR(160) NOT NULL,
    `kind` VARCHAR(32) NOT NULL DEFAULT 'subject',
    `title` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `aspect` VARCHAR(16) NOT NULL DEFAULT '1:1',
    `promptProse` TEXT NULL,
    `promptTags` TEXT NULL,
    `negativePrompt` TEXT NULL,
    `useSeriesStyle` BOOLEAN NOT NULL DEFAULT true,
    `laneKeys` TEXT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'open',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ComicSlot_seriesId_entityId_sortOrder_idx`(`seriesId`, `entityId`, `sortOrder`),
    INDEX `ComicSlot_issueId_idx`(`issueId`),
    UNIQUE INDEX `ComicSlot_seriesId_key_key`(`seriesId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComicAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slotId` INTEGER NOT NULL,
    `laneKey` VARCHAR(64) NOT NULL,
    `engine` VARCHAR(32) NOT NULL,
    `checkpoint` VARCHAR(512) NULL,
    `prompt` TEXT NOT NULL,
    `negativePrompt` TEXT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'QUEUING',
    `error` TEXT NULL,
    `verdict` VARCHAR(16) NOT NULL DEFAULT 'none',
    `note` TEXT NULL,
    `source` VARCHAR(16) NOT NULL DEFAULT 'studio',
    `meta` TEXT NULL,

    UNIQUE INDEX `ComicAttempt_artJobId_key`(`artJobId`),
    INDEX `ComicAttempt_slotId_createdAt_idx`(`slotId`, `createdAt`),
    INDEX `ComicAttempt_status_idx`(`status`),
    INDEX `ComicAttempt_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComicIssue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seriesId` INTEGER NOT NULL,
    `number` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `notes` LONGTEXT NULL,
    `layout` LONGTEXT NOT NULL,
    `layoutVersion` INTEGER NOT NULL DEFAULT 0,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `ComicIssue_seriesId_number_key`(`seriesId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComicCritique` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seriesId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `targetType` VARCHAR(16) NOT NULL,
    `targetId` INTEGER NULL,
    `targetName` VARCHAR(255) NULL,
    `input` LONGTEXT NOT NULL,
    `verdict` VARCHAR(16) NOT NULL,
    `headline` VARCHAR(512) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `model` VARCHAR(64) NOT NULL,
    `trigger` VARCHAR(16) NOT NULL DEFAULT 'ask',

    INDEX `ComicCritique_seriesId_createdAt_idx`(`seriesId`, `createdAt`),
    INDEX `ComicCritique_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ComicEntity` ADD CONSTRAINT `ComicEntity_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `ComicSeries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicSlot` ADD CONSTRAINT `ComicSlot_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `ComicSeries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicSlot` ADD CONSTRAINT `ComicSlot_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `ComicEntity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicSlot` ADD CONSTRAINT `ComicSlot_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `ComicIssue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicAttempt` ADD CONSTRAINT `ComicAttempt_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `ComicSlot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicIssue` ADD CONSTRAINT `ComicIssue_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `ComicSeries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicCritique` ADD CONSTRAINT `ComicCritique_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `ComicSeries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

