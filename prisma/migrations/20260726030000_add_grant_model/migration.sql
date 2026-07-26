-- CreateTable
CREATE TABLE `Grant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `granterId` INTEGER NULL,
    `granteeId` INTEGER NOT NULL,
    `subjectType` ENUM('PROJECT', 'RESOURCE') NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `level` ENUM('VIEW', 'ADMIN') NOT NULL,
    `source` ENUM('MANUAL', 'PURCHASE', 'SUBSCRIPTION', 'ADMIN') NOT NULL,
    `refId` INTEGER NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expiresAt` DATETIME(3) NULL,

    INDEX `Grant_granteeId_subjectType_subjectId_status_idx`(`granteeId`, `subjectType`, `subjectId`, `status`),
    INDEX `Grant_subjectType_subjectId_idx`(`subjectType`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Grant` ADD CONSTRAINT `Grant_granterId_fkey` FOREIGN KEY (`granterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grant` ADD CONSTRAINT `Grant_granteeId_fkey` FOREIGN KEY (`granteeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

