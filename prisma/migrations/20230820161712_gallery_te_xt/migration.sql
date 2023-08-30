-- AlterTable
ALTER TABLE `Gallery` MODIFY `imagePaths` TEXT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/botcafe.webp';
