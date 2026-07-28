-- CreateTable
CREATE TABLE IF NOT EXISTS `DownloadRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'CLAIMED', 'DONE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `source` ENUM('CIVITAI', 'CIVARCHIVE', 'URL') NOT NULL DEFAULT 'CIVITAI',
    `civitaiModelId` INTEGER NULL,
    `civitaiModelVersionId` INTEGER NULL,
    `downloadUrl` TEXT NULL,
    `fileName` VARCHAR(512) NULL,
    `label` VARCHAR(512) NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `claimedAt` DATETIME(3) NULL,
    `claimedBy` VARCHAR(255) NULL,
    `resourceId` INTEGER NULL,
    `error` TEXT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `DownloadRequest_status_id_idx`(`status`, `id`),
    INDEX `DownloadRequest_userId_idx`(`userId`),
    INDEX `DownloadRequest_civitaiModelVersionId_idx`(`civitaiModelVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
