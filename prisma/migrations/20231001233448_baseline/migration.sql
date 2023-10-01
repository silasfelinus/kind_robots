/*
  Warnings:

  - Made the column `userId` on table `Tag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isNSFW` on table `Tag` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_userId_fkey`;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `tagId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `botId` INTEGER NULL DEFAULT 0,
    ADD COLUMN `userId` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `comments` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NOT NULL DEFAULT 0,
    MODIFY `isNSFW` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `isPublic` BOOLEAN NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Channel_tagId_fkey` ON `Channel`(`tagId`);

-- CreateIndex
CREATE INDEX `Message_userId_fkey` ON `Message`(`userId`);

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
