-- Art slots and candidates (Silas 2026-11-11 PT: "support having multiple art
-- sources for art ... manageable from a back end"). Additive only: two new
-- tables, no existing row or column changes. See prisma/art-slots.prisma.
CREATE TABLE `ArtSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slotKey` VARCHAR(300) NOT NULL,
    `projectSlug` VARCHAR(120) NULL,
    `label` VARCHAR(300) NULL,
    `selectedArtImageId` INTEGER NULL,
    `selectedAt` DATETIME(3) NULL,
    `selectedBy` INTEGER NULL,

    UNIQUE INDEX `ArtSlot_slotKey_key`(`slotKey`),
    INDEX `ArtSlot_projectSlug_updatedAt_idx`(`projectSlug`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArtCandidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slotId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `artJobId` INTEGER NULL,
    `source` VARCHAR(40) NOT NULL DEFAULT 'manual',
    `sourceRef` VARCHAR(300) NULL,
    `seed` INTEGER UNSIGNED NULL,
    `checkpoint` VARCHAR(256) NULL,
    `renderFingerprint` VARCHAR(64) NULL,
    `verdict` VARCHAR(20) NOT NULL DEFAULT 'none',
    `note` VARCHAR(500) NULL,

    UNIQUE INDEX `ArtCandidate_slotId_artImageId_key`(`slotId`, `artImageId`),
    INDEX `ArtCandidate_slotId_renderFingerprint_idx`(`slotId`, `renderFingerprint`),
    INDEX `ArtCandidate_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ArtCandidate` ADD CONSTRAINT `ArtCandidate_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `ArtSlot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
