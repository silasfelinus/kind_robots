-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `difficulty` INTEGER NULL,
    ADD COLUMN `group` VARCHAR(191) NULL,
    ADD COLUMN `secretNotes` VARCHAR(191) NULL,
    ADD COLUMN `tier` VARCHAR(191) NULL;
