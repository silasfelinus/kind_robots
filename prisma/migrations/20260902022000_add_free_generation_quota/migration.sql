CREATE TABLE `GenerationQuotaPolicy` (
    `id` INTEGER NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `freeKrea2PerUser` INTEGER NOT NULL DEFAULT 10,
    `dailyCapacity` INTEGER NOT NULL DEFAULT 1500,
    `internalReserve` INTEGER NOT NULL DEFAULT 500,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `GenerationQuotaPolicy`
    (`id`, `enabled`, `freeKrea2PerUser`, `dailyCapacity`, `internalReserve`, `updatedAt`)
VALUES
    (1, true, 10, 1500, 500, CURRENT_TIMESTAMP(3));

CREATE TABLE `FreeGenerationUserDay` (
    `day` DATE NOT NULL,
    `userId` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`day`, `userId`),
    CONSTRAINT `FreeGenerationUserDay_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FreeGenerationPoolDay` (
    `day` DATE NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FreeGenerationClaim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artJobId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `agentProfileId` INTEGER NULL,
    `day` DATE NOT NULL,
    `engine` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FreeGenerationClaim_artJobId_key`(`artJobId`),
    INDEX `FreeGenerationClaim_user_day_idx`(`userId`, `day`),
    INDEX `FreeGenerationClaim_agent_day_idx`(`agentProfileId`, `day`),
    PRIMARY KEY (`id`),
    CONSTRAINT `FreeGenerationClaim_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
