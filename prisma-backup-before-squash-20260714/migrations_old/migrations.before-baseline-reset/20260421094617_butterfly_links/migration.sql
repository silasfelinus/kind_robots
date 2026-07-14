-- AlterTable
ALTER TABLE `Butterfly` ADD COLUMN `artCollectionId` INTEGER NULL,
    ADD COLUMN `artId` INTEGER NULL,
    ADD COLUMN `botId` INTEGER NULL,
    ADD COLUMN `characterId` INTEGER NULL,
    ADD COLUMN `pitchId` INTEGER NULL,
    ADD COLUMN `promptId` INTEGER NULL,
    ADD COLUMN `rewardId` INTEGER NULL,
    ADD COLUMN `scenarioId` INTEGER NULL,
    ADD COLUMN `tagId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Butterfly_artId_fkey` ON `Butterfly`(`artId`);

-- CreateIndex
CREATE INDEX `Butterfly_artCollectionId_fkey` ON `Butterfly`(`artCollectionId`);

-- CreateIndex
CREATE INDEX `Butterfly_botId_fkey` ON `Butterfly`(`botId`);

-- CreateIndex
CREATE INDEX `Butterfly_characterId_fkey` ON `Butterfly`(`characterId`);

-- CreateIndex
CREATE INDEX `Butterfly_pitchId_fkey` ON `Butterfly`(`pitchId`);

-- CreateIndex
CREATE INDEX `Butterfly_promptId_fkey` ON `Butterfly`(`promptId`);

-- CreateIndex
CREATE INDEX `Butterfly_rewardId_fkey` ON `Butterfly`(`rewardId`);

-- CreateIndex
CREATE INDEX `Butterfly_scenarioId_fkey` ON `Butterfly`(`scenarioId`);

-- CreateIndex
CREATE INDEX `Butterfly_tagId_fkey` ON `Butterfly`(`tagId`);

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butterfly` ADD CONSTRAINT `Butterfly_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
