-- DropForeignKey
ALTER TABLE `Channel` DROP FOREIGN KEY `Channel_userId_fkey`;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `title` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
