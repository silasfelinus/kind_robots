-- Slime City: account-owned, virtual-only progression and single-settlement CPU matches.
-- Additive and backward-compatible; no mutation of existing users or payments.
CREATE TABLE `SlimeCityAccount` (
  `userId` INTEGER NOT NULL,
  `data` JSON NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `SlimeCityAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SlimeCityMatch` (
  `id` VARCHAR(36) NOT NULL,
  `userId` INTEGER NOT NULL,
  `mode` VARCHAR(24) NOT NULL,
  `teamId` VARCHAR(32) NOT NULL,
  `foeId` VARCHAR(32) NOT NULL,
  `seed` INTEGER NOT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `settledAt` DATETIME(3) NULL,
  `result` VARCHAR(12) NULL,
  `commands` JSON NULL,
  INDEX `SlimeCityMatch_userId_startedAt_idx`(`userId`, `startedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `SlimeCityMatch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
