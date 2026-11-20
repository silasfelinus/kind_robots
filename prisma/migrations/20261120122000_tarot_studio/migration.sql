-- Additive, private-only tarot production tables. No existing data changes.
CREATE TABLE `TarotDeck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `styleBible` LONGTEXT NOT NULL,
    `defaultEngine` VARCHAR(40) NOT NULL DEFAULT 'krea2',
    `defaultCheckpoint` VARCHAR(255) NULL,
    `defaultLoras` LONGTEXT NOT NULL,
    `backPrompt` LONGTEXT NOT NULL,
    `printStatus` VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `TarotDeck_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TarotCard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deckId` INTEGER NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `arcana` VARCHAR(8) NOT NULL,
    `suit` VARCHAR(16) NULL,
    `rank` VARCHAR(16) NOT NULL,
    `ordinal` INTEGER NOT NULL,
    `oracleId` VARCHAR(80) NOT NULL,
    `prompt` LONGTEXT NOT NULL,
    `checkpoint` VARCHAR(255) NULL,
    `loras` LONGTEXT NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    `upright` TEXT NOT NULL,
    `reversed` TEXT NOT NULL,
    `notes` LONGTEXT NOT NULL,
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `imageUrl` VARCHAR(1024) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `TarotCard_deckId_key_key`(`deckId`, `key`),
    INDEX `TarotCard_deckId_arcana_rank_idx`(`deckId`, `arcana`, `rank`),
    INDEX `TarotCard_deckId_status_idx`(`deckId`, `status`),
    INDEX `TarotCard_artJobId_idx`(`artJobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TarotCard` ADD CONSTRAINT `TarotCard_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `TarotDeck`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
