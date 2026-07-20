-- Media Watchlist: MediaEntry model (media-watchlist/t-009, see conductor
-- projects/media-watchlist/docs/t-008-final-schema-and-browse-api.md).
-- Additive only: one new table, no changes to existing tables/columns.

-- CreateTable
CREATE TABLE `MediaEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL DEFAULT 1,
    `year` INTEGER NOT NULL,
    `mediaType` ENUM('MOVIE', 'TV', 'BOOK', 'NOVELLA', 'AUDIOBOOK', 'COMIC', 'VIDEO_GAME', 'ANIME', 'PODCAST', 'THEATRE', 'SHORT', 'VIDEO_GAME_SHORT') NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `starred` BOOLEAN NOT NULL DEFAULT false,
    `rewatch` INTEGER NULL,
    `releaseYear` INTEGER NULL,
    `watchedMonth` INTEGER NULL,
    `watchedDay` INTEGER NULL,
    `dateRaw` VARCHAR(32) NULL,
    `season` INTEGER NULL,
    `author` VARCHAR(256) NULL,
    `pageCount` INTEGER NULL,
    `durationHours` DOUBLE NULL,
    `issueCount` INTEGER NULL,
    `issueRange` VARCHAR(64) NULL,
    `review` TEXT NULL,
    `reviewPublic` BOOLEAN NOT NULL DEFAULT false,
    `rating` INTEGER NULL,
    `externalId` VARCHAR(128) NULL,
    `externalUrl` VARCHAR(512) NULL,
    `notes` TEXT NULL,
    `sourceFile` VARCHAR(128) NULL,

    INDEX `MediaEntry_userId_year_mediaType_idx`(`userId`, `year`, `mediaType`),
    INDEX `MediaEntry_starred_idx`(`starred`),
    INDEX `MediaEntry_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
