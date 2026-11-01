-- Add a content-addressed, link-scoped course target for the existing Reaction system.
-- No existing Reaction rows, categories, or game progress are changed.
CREATE TABLE `PlumberLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fingerprint` VARCHAR(64) NOT NULL,
    `title` VARCHAR(64) NOT NULL,
    `payload` TEXT NOT NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE INDEX `PlumberLevel_fingerprint_key`(`fingerprint`),
    INDEX `PlumberLevel_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PlumberLevel`
    ADD CONSTRAINT `PlumberLevel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Reaction`
    ADD COLUMN `plumberLevelId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM(
        'ART_IMAGE', 'ART_COLLECTION', 'BOT', 'CHALLENGE_SUBMISSION',
        'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'FACET',
        'PROJECT', 'MESSAGE', 'PROMPT', 'RESOURCE', 'REWARD',
        'SCENARIO', 'THEME', 'TZADDIK', 'PLUMBER_LEVEL'
    ) NOT NULL DEFAULT 'ART_IMAGE';

CREATE INDEX `Reaction_plumberLevelId_idx` ON `Reaction`(`plumberLevelId`);
CREATE UNIQUE INDEX `Reaction_userId_plumberLevelId_key` ON `Reaction`(`userId`, `plumberLevelId`);

ALTER TABLE `Reaction`
    ADD CONSTRAINT `Reaction_plumberLevelId_fkey` FOREIGN KEY (`plumberLevelId`) REFERENCES `PlumberLevel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
