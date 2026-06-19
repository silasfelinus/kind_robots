-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `compositionId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'COMPOSITION', 'DREAM', 'MESSAGE', 'PITCH', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE';

-- CreateTable
CREATE TABLE `Composition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(512) NULL,
    `label` VARCHAR(255) NULL,
    `mode` VARCHAR(64) NOT NULL DEFAULT 'both',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(255) NULL DEFAULT 'system',
    `characterId` INTEGER NULL,
    `dreamId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `pitchId` INTEGER NULL,
    `rewardId` INTEGER NULL,
    `characterBlurb` VARCHAR(512) NULL,
    `dreamBlurb` VARCHAR(512) NULL,
    `scenarioBlurb` VARCHAR(512) NULL,
    `pitchBlurb` VARCHAR(512) NULL,
    `rewardBlurb` VARCHAR(512) NULL,
    `narrativeText` TEXT NULL,
    `artPrompt` TEXT NULL,
    `userId` INTEGER NULL,
    `artImageId` INTEGER NULL,

    UNIQUE INDEX `Composition_artImageId_key`(`artImageId`),
    INDEX `Composition_userId_idx`(`userId`),
    INDEX `Composition_mode_idx`(`mode`),
    INDEX `Composition_characterId_idx`(`characterId`),
    INDEX `Composition_dreamId_idx`(`dreamId`),
    INDEX `Composition_scenarioId_idx`(`scenarioId`),
    INDEX `Composition_pitchId_idx`(`pitchId`),
    INDEX `Composition_rewardId_idx`(`rewardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Reaction_compositionId_idx` ON `Reaction`(`compositionId`);

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_compositionId_fkey` FOREIGN KEY (`compositionId`) REFERENCES `Composition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
