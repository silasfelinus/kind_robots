/*
  Warnings:

  - You are about to drop the column `channelId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_channelId_fkey`;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `channel` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Gallery` ADD COLUMN `channel` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `channelId`;

-- DropTable
DROP TABLE `Channel`;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
