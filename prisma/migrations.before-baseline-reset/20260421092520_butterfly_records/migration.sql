/*
  Warnings:

  - A unique constraint covering the columns `[butterflyId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `butterflyId` INTEGER NULL,
    ADD COLUMN `rarity` INTEGER NULL;

-- CreateTable
CREATE TABLE `Butterfly` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(255) NOT NULL,
    `message` VARCHAR(764) NOT NULL,
    `wingTopColor` VARCHAR(64) NOT NULL,
    `wingBottomColor` VARCHAR(64) NOT NULL,
    `speed` DOUBLE NOT NULL,
    `wingSpeed` DOUBLE NOT NULL,
    `scale` DOUBLE NOT NULL,
    `rarityNumber` INTEGER NOT NULL,
    `artImageId` INTEGER NULL,
    `designer` VARCHAR(255) NULL,
    `userId` INTEGER NULL DEFAULT 1,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Butterfly_name_key`(`name`),
    UNIQUE INDEX `Butterfly_rarityNumber_key`(`rarityNumber`),
    UNIQUE INDEX `Butterfly_artImageId_key`(`artImageId`),
    INDEX `Butterfly_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ButterflyRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `butterflyId` INTEGER NOT NULL,

    INDEX `ButterflyRecord_userId_fkey`(`userId`),
    INDEX `ButterflyRecord_butterflyId_fkey`(`butterflyId`),
    UNIQUE INDEX `ButterflyRecord_userId_butterflyId_key`(`userId`, `butterflyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_butterflyId_key` ON `ArtImage`(`butterflyId`);

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ButterflyRecord` ADD CONSTRAINT `ButterflyRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ButterflyRecord` ADD CONSTRAINT `ButterflyRecord_butterflyId_fkey` FOREIGN KEY (`butterflyId`) REFERENCES `Butterfly`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
