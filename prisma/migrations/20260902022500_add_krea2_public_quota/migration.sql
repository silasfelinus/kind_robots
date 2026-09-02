-- Rainbow Butterflies / Kind Robots shared Krea2 public-free capacity ledger.
--
-- Quota identity is always the canonical human User id. AgentProfile and
-- credential ids are audit provenance only, so connecting more agents never
-- multiplies a human's allowance.

CREATE TABLE `Krea2DailyUserQuota` (
    `quotaDate` DATE NOT NULL,
    `userId` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`quotaDate`, `userId`),
    INDEX `Krea2DailyUserQuota_userId_idx` (`userId`),
    CONSTRAINT `Krea2DailyUserQuota_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Krea2DailyPublicPool` (
    `quotaDate` DATE NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`quotaDate`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Krea2QuotaReservation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `quotaDate` DATE NOT NULL,
    `userId` INTEGER NOT NULL,
    `agentProfileId` INTEGER NULL,
    `credentialId` INTEGER NULL,
    `artJobId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Krea2QuotaReservation_artJobId_key` (`artJobId`),
    INDEX `Krea2QuotaReservation_user_day_idx` (`userId`, `quotaDate`),
    INDEX `Krea2QuotaReservation_agent_idx` (`agentProfileId`, `quotaDate`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Krea2QuotaReservation_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Krea2QuotaReservation_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `Krea2QuotaReservation_artJobId_fkey`
      FOREIGN KEY (`artJobId`) REFERENCES `ArtJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Krea2DeferredFreeJob` (
    `artJobId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `agentProfileId` INTEGER NULL,
    `credentialId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`artJobId`),
    INDEX `Krea2DeferredFreeJob_user_created_idx` (`userId`, `createdAt`),
    CONSTRAINT `Krea2DeferredFreeJob_artJobId_fkey`
      FOREIGN KEY (`artJobId`) REFERENCES `ArtJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Krea2DeferredFreeJob_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Krea2DeferredFreeJob_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
