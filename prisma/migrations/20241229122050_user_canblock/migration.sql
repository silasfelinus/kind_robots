-- AlterTable
ALTER TABLE `User` ADD COLUMN `blockList` VARCHAR(191) NULL,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;