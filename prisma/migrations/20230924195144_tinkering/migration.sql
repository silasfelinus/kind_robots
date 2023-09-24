-- AlterTable
ALTER TABLE `ArtReaction` ADD COLUMN `comment` VARCHAR(191) NULL,
    ADD COLUMN `reaction` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Message` ALTER COLUMN `channelId` DROP DEFAULT;
