-- CreateTable
CREATE TABLE `ArcadeScore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gameSlug` VARCHAR(64) NOT NULL,
    `initials` VARCHAR(3) NOT NULL,
    `score` INTEGER NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArcadeScore_gameSlug_score_idx`(`gameSlug`, `score`),
    INDEX `ArcadeScore_gameSlug_createdAt_idx`(`gameSlug`, `createdAt`),
    INDEX `ArcadeScore_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
