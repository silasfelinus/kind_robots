/*
  Warnings:

  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Gallery` ADD COLUMN `description` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarImage` VARCHAR(191) NULL,
    ADD COLUMN `bio` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Asset`;

-- DropTable
DROP TABLE `Image`;

-- DropTable
DROP TABLE `Profile`;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'image',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isNSFW` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
