/*
  Warnings:

  - You are about to drop the column `galleryId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Media` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_userId_fkey`;

-- AlterTable
ALTER TABLE `Media` DROP COLUMN `galleryId`,
    DROP COLUMN `userId`;

-- CreateTable
CREATE TABLE `Art` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `galleryId` INTEGER NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `clapCount` INTEGER NOT NULL DEFAULT 0,
    `booCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Art_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtReaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `artId` INTEGER NOT NULL,
    `claps` INTEGER NOT NULL DEFAULT 0,
    `boos` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NULL,

    UNIQUE INDEX `ArtReaction_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT 'art',
    `title` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_id_key`(`id`),
    UNIQUE INDEX `Tag_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtReactionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtReactionToTag_AB_unique`(`A`, `B`),
    INDEX `_ArtReactionToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtReactionToTag` ADD CONSTRAINT `_ArtReactionToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtReaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtReactionToTag` ADD CONSTRAINT `_ArtReactionToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
