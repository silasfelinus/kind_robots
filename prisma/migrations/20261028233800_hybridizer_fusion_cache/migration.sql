CREATE TABLE `HybridizerFusion` (
    `id` VARCHAR(64) NOT NULL,
    `leftKey` VARCHAR(150) NOT NULL,
    `rightKey` VARCHAR(150) NOT NULL,
    `recipeVersion` VARCHAR(40) NOT NULL DEFAULT 'v1',
    `title` VARCHAR(255) NOT NULL,
    `depth` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'STUDY',
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `creatorUserId` INTEGER NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `HybridizerFusion_leftKey_rightKey_recipeVersion_key`(`leftKey`, `rightKey`, `recipeVersion`),
    INDEX `HybridizerFusion_creatorUserId_createdAt_idx`(`creatorUserId`, `createdAt`),
    INDEX `HybridizerFusion_isPublic_createdAt_idx`(`isPublic`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
