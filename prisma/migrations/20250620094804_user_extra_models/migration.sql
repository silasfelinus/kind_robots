-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `artModels` JSON NULL,
    ADD COLUMN `lastReward` VARCHAR(191) NULL,
    ADD COLUMN `textModels` JSON NULL;
