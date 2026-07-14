-- AlterTable
ALTER TABLE `Art` ADD COLUMN `checkpointResourceId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Art_checkpointResourceId_fkey` ON `Art`(`checkpointResourceId`);

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_checkpointResourceId_fkey` FOREIGN KEY (`checkpointResourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
