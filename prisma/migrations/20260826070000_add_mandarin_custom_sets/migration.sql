-- CreateTable
CREATE TABLE `MandarinCustomSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `clientId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `cardKeys` LONGTEXT NOT NULL,

    INDEX `MandarinCustomSet_userId_idx`(`userId`),
    UNIQUE INDEX `MandarinCustomSet_userId_clientId_key`(`userId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MandarinArtJobLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `cardKey` VARCHAR(255) NOT NULL,
    `jobId` INTEGER NOT NULL,

    INDEX `MandarinArtJobLink_jobId_idx`(`jobId`),
    UNIQUE INDEX `MandarinArtJobLink_userId_cardKey_key`(`userId`, `cardKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
