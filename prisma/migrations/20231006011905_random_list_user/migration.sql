-- AlterTable
ALTER TABLE `RandomList` ADD COLUMN `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `RandomList` ADD CONSTRAINT `RandomList_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
