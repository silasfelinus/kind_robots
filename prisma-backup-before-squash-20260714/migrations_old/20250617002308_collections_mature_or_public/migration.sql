-- AlterTable
ALTER TABLE `ArtCollection` ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;
