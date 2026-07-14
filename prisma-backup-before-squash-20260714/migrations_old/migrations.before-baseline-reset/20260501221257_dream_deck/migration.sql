-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `dreamId` INTEGER NULL,
    MODIFY `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia', 'Dream') NOT NULL;

-- AlterTable
ALTER TABLE `Pitch` MODIFY `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'ARTGALLERY', 'INSPIRATION', 'DREAM') NOT NULL DEFAULT 'ARTPITCH';

-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `dreamId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM('ART', 'ART_IMAGE', 'PITCH', 'COMPONENT', 'CHAT_EXCHANGE', 'DREAM', 'BOT', 'GALLERY', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'TAG', 'TITLE') NOT NULL DEFAULT 'ART';

-- CreateTable
CREATE TABLE `Dream` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `currentVibe` TEXT NOT NULL,
    `currentPrompt` TEXT NULL,
    `userId` INTEGER NOT NULL DEFAULT 10,
    `pitchId` INTEGER NULL,
    `artId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `textServerId` INTEGER NULL,
    `artServerId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `galleryId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Dream_slug_key`(`slug`),
    INDEX `Dream_userId_idx`(`userId`),
    INDEX `Dream_pitchId_idx`(`pitchId`),
    INDEX `Dream_artId_idx`(`artId`),
    INDEX `Dream_artImageId_idx`(`artImageId`),
    INDEX `Dream_artCollectionId_idx`(`artCollectionId`),
    INDEX `Dream_galleryId_idx`(`galleryId`),
    INDEX `Dream_scenarioId_idx`(`scenarioId`),
    INDEX `Dream_isPublic_idx`(`isPublic`),
    INDEX `Dream_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToTag_AB_unique`(`A`, `B`),
    INDEX `_DreamToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Chat_dreamId_fkey` ON `Chat`(`dreamId`);

-- CreateIndex
CREATE INDEX `Reaction_dreamId_fkey` ON `Reaction`(`dreamId`);

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToTag` ADD CONSTRAINT `_DreamToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToTag` ADD CONSTRAINT `_DreamToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
