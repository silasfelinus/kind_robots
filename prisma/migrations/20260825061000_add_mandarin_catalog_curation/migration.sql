-- CreateTable
CREATE TABLE `MandarinCatalogOverride` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `cardKey` VARCHAR(255) NOT NULL,
    `traditional` VARCHAR(255) NULL,
    `pinyin` VARCHAR(512) NULL,
    `meaning` TEXT NULL,
    `meanings` LONGTEXT NULL,
    `usageNote` TEXT NULL,
    `categories` LONGTEXT NULL,
    `updatedByUserId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `MandarinCatalogOverride_cardKey_key`(`cardKey`),
    INDEX `MandarinCatalogOverride_updatedByUserId_idx`(`updatedByUserId`),
    INDEX `MandarinCatalogOverride_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MandarinCatalogChange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cardKey` VARCHAR(255) NOT NULL,
    `adminUserId` INTEGER NOT NULL,
    `beforeJson` LONGTEXT NOT NULL,
    `afterJson` LONGTEXT NOT NULL,
    `note` TEXT NULL,

    INDEX `MandarinCatalogChange_cardKey_createdAt_idx`(`cardKey`, `createdAt`),
    INDEX `MandarinCatalogChange_adminUserId_createdAt_idx`(`adminUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
