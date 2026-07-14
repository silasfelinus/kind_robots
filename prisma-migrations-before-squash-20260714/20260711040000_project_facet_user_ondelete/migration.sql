-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Facet` DROP FOREIGN KEY `Facet_userId_fkey`;

-- AlterTable
ALTER TABLE `Project` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `Facet` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

