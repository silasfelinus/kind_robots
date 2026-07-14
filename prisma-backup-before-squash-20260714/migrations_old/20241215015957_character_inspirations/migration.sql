-- AlterTable
ALTER TABLE `Art` ADD COLUMN `genres` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `genres` VARCHAR(191) NULL,
    ADD COLUMN `inspirations` VARCHAR(191) NULL;
