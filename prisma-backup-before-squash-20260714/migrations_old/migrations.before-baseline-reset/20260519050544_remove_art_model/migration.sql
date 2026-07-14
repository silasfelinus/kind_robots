-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_checkpointResourceId_fkey`;

-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_serverId_fkey`;

-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_artId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_botId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_characterId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_chatId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_componentId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_milestoneId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_resourceId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_rewardId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_artId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Chat` DROP FOREIGN KEY `Chat_dreamId_fkey`;

-- DropForeignKey
ALTER TABLE `Dream` DROP FOREIGN KEY `Dream_artId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_artId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToArtCollection` DROP FOREIGN KEY `_ArtToArtCollection_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToArtCollection` DROP FOREIGN KEY `_ArtToArtCollection_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToTag` DROP FOREIGN KEY `_ArtToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToTag` DROP FOREIGN KEY `_ArtToTag_B_fkey`;

-- DropIndex
DROP INDEX `ArtImage_artId_fkey` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_artId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_botId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_butterflyId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_characterId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_chatId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_componentId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_galleryId_fkey` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_milestoneId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_pitchId_fkey` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_pitchId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_promptId_fkey` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_promptId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_resourceId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_rewardId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `Butterfly_artId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_artImageId_key` ON `Butterfly`;

-- DropIndex
DROP INDEX `Dream_artId_idx` ON `Dream`;

-- DropIndex
DROP INDEX `Reaction_artId_fkey` ON `Reaction`;

-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `artId`,
    DROP COLUMN `botId`,
    DROP COLUMN `butterflyId`,
    DROP COLUMN `characterId`,
    DROP COLUMN `chatId`,
    DROP COLUMN `componentId`,
    DROP COLUMN `galleryId`,
    DROP COLUMN `milestoneId`,
    DROP COLUMN `pitchId`,
    DROP COLUMN `promptId`,
    DROP COLUMN `rarity`,
    DROP COLUMN `resourceId`,
    DROP COLUMN `rewardId`;

-- AlterTable
ALTER TABLE `Butterfly` DROP COLUMN `artId`;

-- AlterTable
ALTER TABLE `Dream` DROP COLUMN `artId`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `artId`;

-- DropTable
DROP TABLE `Art`;

-- DropTable
DROP TABLE `_ArtToArtCollection`;

-- DropTable
DROP TABLE `_ArtToProduct`;

-- DropTable
DROP TABLE `_ArtToTag`;

-- CreateIndex
CREATE INDEX `Bot_artImageId_fkey` ON `Bot`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Butterfly_artImageId_fkey` ON `Butterfly`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Character_artImageId_fkey` ON `Character`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Chat_artImageId_fkey` ON `Chat`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Component_artImageId_fkey` ON `Component`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Milestone_artImageId_fkey` ON `Milestone`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Pitch_artImageId_fkey` ON `Pitch`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Prompt_artImageId_fkey` ON `Prompt`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Resource_artImageId_fkey` ON `Resource`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `Reward_artImageId_fkey` ON `Reward`(`artImageId` ASC);

-- CreateIndex
CREATE INDEX `User_artImageId_fkey` ON `User`(`artImageId` ASC);

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE `Component` ADD CONSTRAINT `Component_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Dream` RENAME INDEX `Dream_artImageId_idx` TO `Dream_artImageId_fkey`;

