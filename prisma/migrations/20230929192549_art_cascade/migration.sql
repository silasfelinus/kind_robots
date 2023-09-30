-- DropForeignKey
ALTER TABLE `ArtReaction` DROP FOREIGN KEY `ArtReaction_artId_fkey`;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
