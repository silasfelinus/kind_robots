-- AddTable
CREATE TABLE `BrainstormSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `premise` LONGTEXT NOT NULL,
    `resultCount` INTEGER NOT NULL DEFAULT 8,
    `constraints` LONGTEXT NULL,
    `examples` LONGTEXT NULL,
    `mode` VARCHAR(80) NOT NULL DEFAULT 'freeform',
    `batchShape` VARCHAR(32) NOT NULL DEFAULT 'focused',
    `returnTypes` LONGTEXT NULL,
    `source` LONGTEXT NULL,
    `batches` LONGTEXT NOT NULL,
    `activeBatchId` VARCHAR(200) NULL,
    `lastGeneratedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `BrainstormSession_userId_updatedAt_idx`(`userId`, `updatedAt`),
    INDEX `BrainstormSession_userId_isActive_idx`(`userId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddTable
CREATE TABLE `BrainstormCandidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sessionId` INTEGER NOT NULL,
    `clientId` VARCHAR(200) NOT NULL,
    `batchId` VARCHAR(200) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(120) NULL,
    `text` LONGTEXT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `feedback` LONGTEXT NULL,
    `edited` BOOLEAN NOT NULL DEFAULT false,
    `parentClientId` VARCHAR(200) NULL,
    `revisions` LONGTEXT NOT NULL,
    `meta` LONGTEXT NULL,

    UNIQUE INDEX `BrainstormCandidate_sessionId_clientId_key`(`sessionId`, `clientId`),
    INDEX `BrainstormCandidate_sessionId_batchId_position_idx`(`sessionId`, `batchId`, `position`),
    INDEX `BrainstormCandidate_sessionId_status_idx`(`sessionId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BrainstormCandidate` ADD CONSTRAINT `BrainstormCandidate_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `BrainstormSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
