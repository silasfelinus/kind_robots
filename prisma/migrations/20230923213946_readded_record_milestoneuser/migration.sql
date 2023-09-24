-- DropIndex
DROP INDEX `MilestoneRecord_userId_fkey` ON `MilestoneRecord`;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
