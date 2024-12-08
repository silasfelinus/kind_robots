-- AlterTable
ALTER TABLE `Character` ADD COLUMN `personality` VARCHAR(191) NULL,
    MODIFY `statName4` VARCHAR(191) NULL DEFAULT 'Flexibilty';
