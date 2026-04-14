-- AlterTable
ALTER TABLE `User` ADD COLUMN `isMember` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `memberUntil` DATETIME(3) NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL;
