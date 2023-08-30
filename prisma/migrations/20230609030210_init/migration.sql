/*
  Warnings:

  - You are about to drop the `Pitch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Pitch`;

-- CreateTable
CREATE TABLE `Todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'default',
    `isFinished` BOOLEAN NOT NULL DEFAULT false,
    `user` VARCHAR(191) NOT NULL DEFAULT 'cafepurr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
