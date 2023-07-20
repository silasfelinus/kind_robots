/*
  Warnings:

  - You are about to drop the column `dislikes` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `dislikes` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Resource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `dislikes`,
    DROP COLUMN `likes`,
    ADD COLUMN `hasHistory` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `dislikes`,
    DROP COLUMN `likes`;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER') NOT NULL DEFAULT 'USER',
    `content` VARCHAR(191) NOT NULL,
    `promptId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
