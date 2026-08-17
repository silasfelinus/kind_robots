-- Expand-only durable storage for editable Project-owned page copy.
CREATE TABLE `ProjectPageContent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` INTEGER NOT NULL,
    `pageKey` VARCHAR(128) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `ProjectPageContent_projectId_pageKey_key`(`projectId`, `pageKey`),
    INDEX `ProjectPageContent_projectId_idx`(`projectId`),
    INDEX `ProjectPageContent_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
