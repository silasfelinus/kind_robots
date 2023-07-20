/*
  Warnings:

  - You are about to drop the column `hiddenTags` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserDesignFan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserDesignFan` DROP FOREIGN KEY `UserDesignFan_designId_fkey`;

-- DropForeignKey
ALTER TABLE `UserDesignFan` DROP FOREIGN KEY `UserDesignFan_userId_fkey`;

-- AlterTable
ALTER TABLE `Design` ADD COLUMN `allowComments` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Quest` ADD COLUMN `imageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `hiddenTags`,
    ADD COLUMN `hideComments` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `UserDesignFan`;

-- CreateTable
CREATE TABLE `UserReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `resourceId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `imageId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `designId` INTEGER NULL,
    `botId` INTEGER NULL,
    `reviewType` ENUM('RESOURCE', 'PROMPT', 'IMAGE', 'GALLERY', 'DESIGN', 'BOT') NOT NULL,
    `comment` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `isFan` BOOLEAN NOT NULL DEFAULT false,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Quest` ADD CONSTRAINT `Quest_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `Design`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
