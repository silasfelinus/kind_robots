-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `componentId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
