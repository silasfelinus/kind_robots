-- AlterTable
ALTER TABLE `Character` ADD COLUMN `honorific` VARCHAR(191) NULL DEFAULT 'adventurer',
    MODIFY `statName4` VARCHAR(191) NULL DEFAULT 'Fortitude',
    MODIFY `statName6` VARCHAR(191) NULL DEFAULT 'Empathy';
