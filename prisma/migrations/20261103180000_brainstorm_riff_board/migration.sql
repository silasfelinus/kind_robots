-- Brainstorm riff board: shared table prompts, human-written lines, and a
-- Reaction target for lines. Additive only; no existing rows change.
CREATE TABLE `BrainstormRiff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL,
    `starterKey` VARCHAR(80) NULL,
    `flavor` VARCHAR(32) NOT NULL DEFAULT 'list',
    `title` VARCHAR(160) NOT NULL,
    `stem` VARCHAR(240) NULL,
    `vibe` TEXT NULL,
    `crossoverIds` VARCHAR(200) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `lastLineAt` DATETIME(3) NULL,
    UNIQUE INDEX `BrainstormRiff_starterKey_key`(`starterKey`),
    INDEX `BrainstormRiff_isPublic_lastLineAt_idx`(`isPublic`, `lastLineAt`),
    INDEX `BrainstormRiff_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BrainstormLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `riffId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `authorName` VARCHAR(60) NOT NULL,
    `text` VARCHAR(600) NOT NULL,
    `aiSpark` VARCHAR(240) NULL,
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    INDEX `BrainstormLine_riffId_createdAt_idx`(`riffId`, `createdAt`),
    INDEX `BrainstormLine_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BrainstormLine`
    ADD CONSTRAINT `BrainstormLine_riffId_fkey` FOREIGN KEY (`riffId`) REFERENCES `BrainstormRiff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Reaction`
    ADD COLUMN `brainstormLineId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM(
        'ART_IMAGE', 'ART_COLLECTION', 'BOT', 'CHALLENGE_SUBMISSION',
        'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'FACET',
        'PROJECT', 'MESSAGE', 'PROMPT', 'RESOURCE', 'REWARD',
        'SCENARIO', 'THEME', 'TZADDIK', 'PLUMBER_LEVEL', 'BRAINSTORM_LINE'
    ) NOT NULL DEFAULT 'ART_IMAGE';

CREATE INDEX `Reaction_brainstormLineId_idx` ON `Reaction`(`brainstormLineId`);
CREATE UNIQUE INDEX `Reaction_userId_brainstormLineId_key` ON `Reaction`(`userId`, `brainstormLineId`);

ALTER TABLE `Reaction`
    ADD CONSTRAINT `Reaction_brainstormLineId_fkey` FOREIGN KEY (`brainstormLineId`) REFERENCES `BrainstormLine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
