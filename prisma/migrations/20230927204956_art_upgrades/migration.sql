/*
  Warnings:

  - You are about to drop the column `booCount` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `clapCount` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `artPromptId` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the `_ArtToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_artPromptId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToUser` DROP FOREIGN KEY `_ArtToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToUser` DROP FOREIGN KEY `_ArtToUser_B_fkey`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `booCount`,
    DROP COLUMN `clapCount`,
    DROP COLUMN `user`,
    ADD COLUMN `userId` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ArtPrompt` ADD COLUMN `galleryId` INTEGER NOT NULL DEFAULT 21;

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `artPromptId`;

-- DropTable
DROP TABLE `_ArtToUser`;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtPrompt` ADD CONSTRAINT `ArtPrompt_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
