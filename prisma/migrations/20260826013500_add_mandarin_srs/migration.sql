-- CreateTable
CREATE TABLE `MandarinCardProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `cardKey` VARCHAR(255) NOT NULL,
    `dimension` VARCHAR(32) NOT NULL DEFAULT 'overall',
    `repetitions` INTEGER NOT NULL DEFAULT 0,
    `lapses` INTEGER NOT NULL DEFAULT 0,
    `intervalDays` INTEGER NOT NULL DEFAULT 0,
    `easeFactor` DOUBLE NOT NULL DEFAULT 2.5,
    `dueAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastRating` VARCHAR(16) NULL,
    `lastReviewedAt` DATETIME(3) NULL,

    UNIQUE INDEX `MandarinCardProgress_userId_cardKey_dimension_key`(`userId`, `cardKey`, `dimension`),
    INDEX `MandarinCardProgress_userId_dueAt_idx`(`userId`, `dueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MandarinReviewEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `cardKey` VARCHAR(255) NOT NULL,
    `dimension` VARCHAR(32) NOT NULL DEFAULT 'overall',
    `rating` VARCHAR(16) NOT NULL,
    `intervalDays` INTEGER NOT NULL,
    `ratedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MandarinReviewEvent_userId_cardKey_idx`(`userId`, `cardKey`),
    INDEX `MandarinReviewEvent_userId_ratedAt_idx`(`userId`, `ratedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
