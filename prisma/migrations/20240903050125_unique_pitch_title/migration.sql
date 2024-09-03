/*
  Warnings:

  - You are about to drop the `ArtReaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtReactionToTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pitch]` on the table `Pitch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `ArtReaction` DROP FOREIGN KEY `ArtReaction_artId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtReaction` DROP FOREIGN KEY `ArtReaction_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtReaction` DROP FOREIGN KEY `ArtReaction_userId_fkey`;

-- DropTable
DROP TABLE `ArtReaction`;

-- DropTable
DROP TABLE `_ArtReactionToTag`;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `artId` INTEGER NULL,
    `claps` INTEGER NOT NULL DEFAULT 0,
    `boos` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `reaction` VARCHAR(191) NULL,
    `pitchId` INTEGER NULL,

    UNIQUE INDEX `Reaction_id_key`(`id`),
    INDEX `Reaction_artId_fkey`(`artId`),
    INDEX `Reaction_pitchId_fkey`(`pitchId`),
    INDEX `Reaction_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ReactionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    INDEX `_ReactionToTag_B_index`(`B`),
    PRIMARY KEY (`A`, `B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Pitch_pitch_key` ON `Pitch`(`pitch`);

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
