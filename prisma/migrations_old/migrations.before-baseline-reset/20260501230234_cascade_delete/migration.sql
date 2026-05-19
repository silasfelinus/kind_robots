-- DropForeignKey
ALTER TABLE `Chat` DROP FOREIGN KEY `Chat_dreamId_fkey`;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
