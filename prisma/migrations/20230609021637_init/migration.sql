/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Thread` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Image` ADD COLUMN `isNSFW` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `Collection`;

-- DropTable
DROP TABLE `Thread`;

-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'asset',
    `user` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    `user` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
