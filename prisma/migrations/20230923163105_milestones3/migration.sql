-- AlterTable
ALTER TABLE `Milestone` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `tooltip` VARCHAR(191) NULL DEFAULT 'this has not been revealed';
