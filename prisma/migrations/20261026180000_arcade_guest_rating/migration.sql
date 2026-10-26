-- Additive guest star ratings for the public Arcade. New table only; nothing
-- the running build reads is touched.
-- CreateTable
CREATE TABLE `ArcadeGuestRating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gameSlug` VARCHAR(64) NOT NULL,
    `voterHash` VARCHAR(64) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(280) NULL,
    `commentHeld` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ArcadeGuestRating_gameSlug_rating_idx`(`gameSlug`, `rating`),
    INDEX `ArcadeGuestRating_voterHash_createdAt_idx`(`voterHash`, `createdAt`),
    UNIQUE INDEX `ArcadeGuestRating_gameSlug_voterHash_key`(`gameSlug`, `voterHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
