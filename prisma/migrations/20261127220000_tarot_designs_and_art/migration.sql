-- Additive: tarot design samples, art variants, selected art and reader visibility.
-- No existing column changes; the old build ignores the new columns and tables.
ALTER TABLE `TarotDeck`
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `approvedDesignId` INTEGER NULL,
    ADD COLUMN `backArtId` INTEGER NULL;

ALTER TABLE `TarotCard`
    ADD COLUMN `selectedArtId` INTEGER NULL;

CREATE TABLE `TarotDesign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deckId` INTEGER NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `stylePrompt` LONGTEXT NOT NULL,
    `backPrompt` LONGTEXT NOT NULL,
    `engine` VARCHAR(40) NOT NULL DEFAULT 'krea2',
    `checkpoint` VARCHAR(255) NULL,
    `loras` LONGTEXT NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'EXPLORING',
    `notes` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `TarotDesign_deckId_key_key`(`deckId`, `key`),
    INDEX `TarotDesign_deckId_status_idx`(`deckId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TarotArt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deckId` INTEGER NOT NULL,
    `designId` INTEGER NULL,
    `cardId` INTEGER NULL,
    `side` VARCHAR(8) NOT NULL DEFAULT 'FACE',
    `purpose` VARCHAR(12) NOT NULL DEFAULT 'SAMPLE',
    `prompt` LONGTEXT NOT NULL,
    `engine` VARCHAR(40) NOT NULL DEFAULT 'krea2',
    `checkpoint` VARCHAR(255) NULL,
    `loras` LONGTEXT NOT NULL,
    `width` INTEGER NOT NULL DEFAULT 832,
    `height` INTEGER NOT NULL DEFAULT 1248,
    `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    `error` TEXT NULL,
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `TarotArt_deckId_status_idx`(`deckId`, `status`),
    INDEX `TarotArt_cardId_idx`(`cardId`),
    INDEX `TarotArt_designId_idx`(`designId`),
    INDEX `TarotArt_artJobId_idx`(`artJobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TarotDesign` ADD CONSTRAINT `TarotDesign_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `TarotDeck`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TarotArt` ADD CONSTRAINT `TarotArt_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `TarotDeck`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TarotArt` ADD CONSTRAINT `TarotArt_designId_fkey`
    FOREIGN KEY (`designId`) REFERENCES `TarotDesign`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TarotArt` ADD CONSTRAINT `TarotArt_cardId_fkey`
    FOREIGN KEY (`cardId`) REFERENCES `TarotCard`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- The Kind Robots deck is the free public reader deck (approved art only).
UPDATE `TarotDeck` SET `isPublic` = true WHERE `slug` = 'kind-robots';

-- Projects page entry for the public reader; never overwrite a hand-set URL.
UPDATE `Project`
SET `channelKey` = 'projects', `tabKey` = 'tarot', `liveUrl` = '/play/tarot'
WHERE `conductorSlug` = 'tarot-studio' AND (`liveUrl` IS NULL OR `liveUrl` = '');
