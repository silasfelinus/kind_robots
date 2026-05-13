/*
  Warnings:

  - You are about to drop the column `reactionId` on the `ArtImage` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `ArtImage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[artImageId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_tagId_fkey`;

-- DropIndex
DROP INDEX `ArtImage_reactionId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_tagId_key` ON `ArtImage`;

-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `reactionId`,
    DROP COLUMN `tagId`,
    ADD COLUMN `cfg` INTEGER NULL DEFAULT 3,
    ADD COLUMN `cfgHalf` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `checkpoint` VARCHAR(256) NULL,
    ADD COLUMN `checkpointResourceId` INTEGER NULL,
    ADD COLUMN `designer` VARCHAR(764) NULL,
    ADD COLUMN `genres` VARCHAR(191) NULL,
    ADD COLUMN `imagePath` VARCHAR(191) NULL,
    ADD COLUMN `isMature` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `negativePrompt` TEXT NULL,
    ADD COLUMN `path` VARCHAR(764) NULL,
    ADD COLUMN `promptString` TEXT NULL,
    ADD COLUMN `sampler` VARCHAR(764) NULL,
    ADD COLUMN `seed` INTEGER NULL DEFAULT -1,
    ADD COLUMN `serverId` INTEGER NULL,
    ADD COLUMN `serverName` VARCHAR(256) NULL,
    ADD COLUMN `serverUrl` VARCHAR(764) NULL,
    ADD COLUMN `steps` INTEGER NULL,
    ADD COLUMN `thumbnailData` MEDIUMTEXT NULL;

-- CreateTable
CREATE TABLE `_ArtImageToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtImageToTag_AB_unique`(`A`, `B`),
    INDEX `_ArtImageToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtCollectionToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtCollectionToArtImage_AB_unique`(`A`, `B`),
    INDEX `_ArtCollectionToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ArtImage_artId_fkey` ON `ArtImage`(`artId`);

-- CreateIndex
CREATE INDEX `ArtImage_serverId_fkey` ON `ArtImage`(`serverId`);

-- CreateIndex
CREATE INDEX `ArtImage_checkpointResourceId_fkey` ON `ArtImage`(`checkpointResourceId`);

-- CreateIndex
CREATE INDEX `ArtImage_pitchId_fkey` ON `ArtImage`(`pitchId`);

-- CreateIndex
CREATE INDEX `ArtImage_promptId_fkey` ON `ArtImage`(`promptId`);

-- CreateIndex
CREATE UNIQUE INDEX `Tag_artImageId_key` ON `Tag`(`artImageId`);

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_checkpointResourceId_fkey` FOREIGN KEY (`checkpointResourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageToTag` ADD CONSTRAINT `_ArtImageToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageToTag` ADD CONSTRAINT `_ArtImageToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtCollectionToArtImage` ADD CONSTRAINT `_ArtCollectionToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
