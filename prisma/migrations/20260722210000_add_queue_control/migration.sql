-- ArtJob queue pause control (art queue: front-end pause/resume button).
-- Additive only: one new singleton table (id = 1), no changes to existing
-- tables/columns. When `paused` is true the claim endpoint stops handing jobs
-- to relays, so the queue is preserved but not drained until resumed.

-- CreateTable
CREATE TABLE `QueueControl` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `paused` BOOLEAN NOT NULL DEFAULT false,
    `pausedBy` VARCHAR(255) NULL,
    `pausedAt` DATETIME(3) NULL,
    `note` VARCHAR(500) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the single control row (unpaused).
INSERT INTO `QueueControl` (`id`, `paused`) VALUES (1, false);
