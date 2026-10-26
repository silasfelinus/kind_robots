-- Additive, backward-compatible table for opt-in ratings and bounded run traces.
CREATE TABLE `PlaybookRunReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gameSlug` VARCHAR(64) NOT NULL,
    `runId` VARCHAR(36) NOT NULL,
    `userId` INTEGER NULL,
    `endingKey` VARCHAR(180) NOT NULL,
    `stars` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `history` LONGTEXT NOT NULL,
    INDEX `PlaybookRunReview_gameSlug_stars_createdAt_idx`(`gameSlug`, `stars`, `createdAt`),
    UNIQUE INDEX `PlaybookRunReview_gameSlug_runId_key`(`gameSlug`, `runId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
