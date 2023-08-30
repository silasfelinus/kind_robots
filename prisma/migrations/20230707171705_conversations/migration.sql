/*
  Warnings:

  - Added the required column `channel` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_channelId_fkey`;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `channel` VARCHAR(191) NOT NULL,
    MODIFY `channelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
