-- DropForeignKey
ALTER TABLE `Code` DROP FOREIGN KEY `Code_userId_fkey`;

-- AddForeignKey
ALTER TABLE `Code` ADD CONSTRAINT `Code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
