/*
  Warnings:

  - You are about to drop the column `content` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `reward` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Game` DROP FOREIGN KEY `Game_userId_fkey`;

-- AlterTable
ALTER TABLE `Game` DROP COLUMN `content`,
    DROP COLUMN `icon`,
    DROP COLUMN `points`,
    DROP COLUMN `reward`,
    DROP COLUMN `userId`,
    ADD COLUMN `creator` VARCHAR(191) NULL,
    ADD COLUMN `descriptor` TEXT NULL,
    ADD COLUMN `players` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `winner` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_ArtToGame` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToGame_AB_unique`(`A`, `B`),
    INDEX `_ArtToGame_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtPromptToGame` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtPromptToGame_AB_unique`(`A`, `B`),
    INDEX `_ArtPromptToGame_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GameToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GameToUser_AB_unique`(`A`, `B`),
    INDEX `_GameToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArtToGame` ADD CONSTRAINT `_ArtToGame_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToGame` ADD CONSTRAINT `_ArtToGame_B_fkey` FOREIGN KEY (`B`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtPromptToGame` ADD CONSTRAINT `_ArtPromptToGame_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtPrompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtPromptToGame` ADD CONSTRAINT `_ArtPromptToGame_B_fkey` FOREIGN KEY (`B`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GameToUser` ADD CONSTRAINT `_GameToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GameToUser` ADD CONSTRAINT `_GameToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
