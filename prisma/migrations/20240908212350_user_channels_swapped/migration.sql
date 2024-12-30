/*
  Warnings:

  - You are about to drop the column `userId` on the `Channel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Channel` DROP FOREIGN KEY `Channel_userId_fkey`;

-- AlterTable
ALTER TABLE `Channel` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `Gallery` ADD COLUMN `channelId` INTEGER NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `channelId` INTEGER NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
