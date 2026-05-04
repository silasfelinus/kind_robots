-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_reactionId_fkey`;

-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `artCollectionId` INTEGER NULL,
    ADD COLUMN `butterflyId` INTEGER NULL,
    ADD COLUMN `characterId` INTEGER NULL,
    ADD COLUMN `scenarioId` INTEGER NULL,
    ADD COLUMN `themeId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM('ART', 'ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'GALLERY', 'MESSAGE', 'PITCH', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'TAG', 'THEME') NOT NULL DEFAULT 'ART';

-- CreateIndex
CREATE INDEX `Reaction_artImageId_fkey` ON `Reaction`(`artImageId`);

-- CreateIndex
CREATE INDEX `Reaction_artCollectionId_fkey` ON `Reaction`(`artCollectionId`);

-- CreateIndex
CREATE INDEX `Reaction_butterflyId_fkey` ON `Reaction`(`butterflyId`);

-- CreateIndex
CREATE INDEX `Reaction_characterId_fkey` ON `Reaction`(`characterId`);

-- CreateIndex
CREATE INDEX `Reaction_scenarioId_fkey` ON `Reaction`(`scenarioId`);

-- CreateIndex
CREATE INDEX `Reaction_themeId_fkey` ON `Reaction`(`themeId`);

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_butterflyId_fkey` FOREIGN KEY (`butterflyId`) REFERENCES `Butterfly`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
