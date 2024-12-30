/*
  Warnings:

  - A unique constraint covering the columns `[characterId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `characterId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(256) NOT NULL,
    `achievements` VARCHAR(256) NULL,
    `alignment` VARCHAR(256) NULL,
    `experience` INTEGER NULL DEFAULT 0,
    `level` INTEGER NULL DEFAULT 1,
    `class` VARCHAR(764) NULL,
    `gender` VARCHAR(764) NULL,
    `species` VARCHAR(764) NULL,
    `backstory` VARCHAR(2048) NULL,
    `drive` VARCHAR(764) NULL,
    `inventory` VARCHAR(2048) NULL,
    `statName1` VARCHAR(191) NULL DEFAULT 'Luck',
    `statValue1` INTEGER NULL DEFAULT 9,
    `statName2` VARCHAR(191) NULL DEFAULT 'Swol',
    `statValue2` INTEGER NULL DEFAULT 9,
    `statName3` VARCHAR(191) NULL DEFAULT 'Wits',
    `statValue3` INTEGER NULL DEFAULT 9,
    `statName4` VARCHAR(191) NULL DEFAULT 'Durability',
    `statValue4` INTEGER NULL DEFAULT 9,
    `statName5` VARCHAR(191) NULL DEFAULT 'Rizz',
    `statValue5` INTEGER NULL DEFAULT 9,
    `statName6` VARCHAR(191) NULL DEFAULT 'Skibidi',
    `statValue6` INTEGER NULL DEFAULT 9,
    `quirks` VARCHAR(2048) NULL,
    `skills` VARCHAR(2048) NULL,
    `genre` VARCHAR(256) NULL,
    `artImageId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL DEFAULT 10,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_characterId_key` ON `ArtImage`(`characterId`);

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
