-- AlterTable
ALTER TABLE `Theme` ADD COLUMN `colorScheme` VARCHAR(191) NOT NULL DEFAULT 'light',
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `prefersDark` BOOLEAN NOT NULL DEFAULT false;
