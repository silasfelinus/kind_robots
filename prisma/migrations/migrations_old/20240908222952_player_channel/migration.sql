/*
  Warnings:

  - You are about to drop the `_ChannelToPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ChannelToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ChannelToPlayer` DROP FOREIGN KEY `_ChannelToPlayer_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ChannelToPlayer` DROP FOREIGN KEY `_ChannelToPlayer_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ChannelToUser` DROP FOREIGN KEY `_ChannelToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ChannelToUser` DROP FOREIGN KEY `_ChannelToUser_B_fkey`;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Player` ADD COLUMN `channelId` INTEGER NULL;

-- DropTable
DROP TABLE `_ChannelToPlayer`;

-- DropTable
DROP TABLE `_ChannelToUser`;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
