-- Generic ProjectArtImage-style history join for entity types that don't
-- have a dedicated join table yet (bot/character/scenario/reward/facet/
-- achievement). entityId is polymorphic across those tables, so only
-- artImageId gets a real FK; entityType+entityId is enforced at the app
-- layer (server/utils/entityArt.ts), same as every other polymorphic
-- entityType/entityId pair in this codebase.
--
-- SAFETY: purely additive. New table + new foreign key only; no existing
-- table, column, or data is touched. Part of interface-vision/t-028 (conductor).

-- CreateTable
CREATE TABLE `EntityArtImage` (
    `entityType` VARCHAR(32) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EntityArtImage_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`entityType`, `entityId`, `artImageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EntityArtImage` ADD CONSTRAINT `EntityArtImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
