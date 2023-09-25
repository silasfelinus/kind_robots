/*
  Warnings:

  - You are about to drop the column `artId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_artId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `artId`;

-- CreateTable
CREATE TABLE `_ArtToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToUser_AB_unique`(`A`, `B`),
    INDEX `_ArtToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArtToUser` ADD CONSTRAINT `_ArtToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToUser` ADD CONSTRAINT `_ArtToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
