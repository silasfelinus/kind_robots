-- Additive, private-only player ingredient uploads for Hybridizer (t-008).
CREATE TABLE `HybridizerUpload` (
    `id` VARCHAR(24) NOT NULL,
    `ownerUserId` INTEGER NOT NULL,
    `title` VARCHAR(60) NOT NULL,
    `description` VARCHAR(240) NOT NULL DEFAULT '',
    `kind` VARCHAR(12) NOT NULL DEFAULT 'creature',
    `artImageId` INTEGER NOT NULL,
    `consentAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `HybridizerUpload_ownerUserId_isActive_createdAt_idx`(`ownerUserId`, `isActive`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
