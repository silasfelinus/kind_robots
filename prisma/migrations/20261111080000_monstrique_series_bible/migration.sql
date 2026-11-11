-- Monstrique series bible: per-character edits and art requests for the
-- admin-only bible page. Additive only; no existing rows change.
CREATE TABLE `MonstriqueBibleEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `characterKey` VARCHAR(64) NOT NULL,
    `displayName` VARCHAR(160) NULL,
    `notes` TEXT NULL,
    `loraStatus` VARCHAR(32) NOT NULL DEFAULT 'dataset-needed',
    `loraResourceName` VARCHAR(255) NULL,
    `heroArtImageId` INTEGER NULL,
    `requests` LONGTEXT NULL,
    `updatedBy` INTEGER NULL,
    UNIQUE INDEX `MonstriqueBibleEntry_characterKey_key`(`characterKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
