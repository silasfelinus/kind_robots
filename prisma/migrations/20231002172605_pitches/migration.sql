/*
  Warnings:

  - You are about to drop the column `comments` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channelId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Channel` DROP FOREIGN KEY `Channel_tagId_fkey`;

-- AlterTable
ALTER TABLE `Art` ADD COLUMN `boos` INTEGER NULL DEFAULT 0,
    ADD COLUMN `claps` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ArtReaction` ADD COLUMN `pitchId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `comments`,
    DROP COLUMN `username`,
    ADD COLUMN `channelId` INTEGER NULL,
    ADD COLUMN `designer` VARCHAR(191) NULL,
    ADD COLUMN `flavorText` VARCHAR(191) NULL,
    ADD COLUMN `pitch` VARCHAR(191) NULL,
    MODIFY `label` VARCHAR(191) NOT NULL DEFAULT 'pitch';

-- CreateTable
CREATE TABLE `Pitch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `title` VARCHAR(191) NOT NULL,
    `pitch` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `claps` INTEGER NOT NULL DEFAULT 0,
    `boos` INTEGER NOT NULL DEFAULT 0,
    `characterLimit` INTEGER NULL,
    `channelId` INTEGER NULL,

    UNIQUE INDEX `Pitch_id_key`(`id`),
    UNIQUE INDEX `Pitch_channelId_key`(`channelId`),
    INDEX `Pitch_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToTag_AB_unique`(`A`, `B`),
    INDEX `_ArtToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Tag_channelId_key` ON `Tag`(`channelId`);

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToTag` ADD CONSTRAINT `_ArtToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToTag` ADD CONSTRAINT `_ArtToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
