-- DropForeignKey
ALTER TABLE `ArtReaction` DROP FOREIGN KEY `ArtReaction_artId_fkey`;

-- AlterTable
ALTER TABLE `ArtReaction` MODIFY `artId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ArtReaction` ADD CONSTRAINT `ArtReaction_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
