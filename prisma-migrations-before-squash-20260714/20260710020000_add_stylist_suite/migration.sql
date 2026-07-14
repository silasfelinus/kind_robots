-- Hair by Superkate suite persistence (additive only: two new tables + FKs;
-- no existing tables, columns, or data touched). Replaces the /stylist
-- suite's localStorage mock so the client book and appointment history sync
-- across the studio user's devices.

-- CreateTable
CREATE TABLE `StylistClient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,

    INDEX `StylistClient_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StylistAppointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `clientId` INTEGER NULL,
    `clientName` VARCHAR(255) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `hourlyRateCents` INTEGER NOT NULL DEFAULT 0,
    `minutes` INTEGER NOT NULL DEFAULT 0,
    `productCostCents` INTEGER NOT NULL DEFAULT 0,
    `totalCents` INTEGER NOT NULL DEFAULT 0,

    INDEX `StylistAppointment_userId_idx`(`userId`),
    INDEX `StylistAppointment_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StylistClient` ADD CONSTRAINT `StylistClient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StylistAppointment` ADD CONSTRAINT `StylistAppointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StylistAppointment` ADD CONSTRAINT `StylistAppointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `StylistClient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
