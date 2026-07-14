-- DropIndex
DROP INDEX `Bot_id_key` ON `Bot`;

-- CreateTable
CREATE TABLE `EmotionImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `emotion` ENUM('NEUTRAL', 'HAPPY', 'SAD', 'EXCITED', 'NERVOUS', 'ANGRY', 'CONFUSED', 'PROUD') NOT NULL DEFAULT 'NEUTRAL',
    `label` VARCHAR(256) NULL,
    `emoticon` VARCHAR(32) NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `message` TEXT NULL,
    `additionalPhrases` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `EmotionImage_artImageId_key`(`artImageId`),
    INDEX `EmotionImage_artImageId_idx`(`artImageId`),
    INDEX `EmotionImage_botId_idx`(`botId`),
    INDEX `EmotionImage_characterId_idx`(`characterId`),
    UNIQUE INDEX `EmotionImage_botId_emotion_key`(`botId`, `emotion`),
    UNIQUE INDEX `EmotionImage_characterId_emotion_key`(`characterId`, `emotion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
