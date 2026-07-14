/*
  Warnings:

  - You are about to drop the column `channelId` on the `Component` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Component` DROP FOREIGN KEY `Component_channelId_fkey`;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `componentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Component` DROP COLUMN `channelId`;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
