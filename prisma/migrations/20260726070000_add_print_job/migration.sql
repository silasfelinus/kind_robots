-- CreateTable
CREATE TABLE `PrintJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderItemId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `printfulOrderId` VARCHAR(191) NULL,
    `printfulVariantId` VARCHAR(128) NOT NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'IN_PRODUCTION', 'SHIPPED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `trackingUrl` VARCHAR(764) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PrintJob_orderItemId_key`(`orderItemId`),
    INDEX `PrintJob_artImageId_idx`(`artImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PrintJob` ADD CONSTRAINT `PrintJob_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrintJob` ADD CONSTRAINT `PrintJob_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
