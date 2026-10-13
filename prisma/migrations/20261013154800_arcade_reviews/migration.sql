-- Additive arcade reviews; leaves ArcadeScore and shared Reactions untouched.
CREATE TABLE `ArcadeReview` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `gameSlug` VARCHAR(64) NOT NULL,
  `userId` INTEGER NOT NULL,
  `username` VARCHAR(255) NULL,
  `rating` INTEGER NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ArcadeReview_gameSlug_userId_key`(`gameSlug`, `userId`),
  INDEX `ArcadeReview_gameSlug_rating_idx`(`gameSlug`, `rating`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
