/*
  Warnings:

  - You are about to drop the column `reward` on the `Todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Todo` DROP COLUMN `reward`,
    ADD COLUMN `rewardId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `milestoneId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Reward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `power` VARCHAR(191) NOT NULL,
    `collection` VARCHAR(191) NOT NULL DEFAULT 'Genesis',
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMilestones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `UserMilestones_id_key`(`id`),
    UNIQUE INDEX `UserMilestones_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMilestones` ADD CONSTRAINT `UserMilestones_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
