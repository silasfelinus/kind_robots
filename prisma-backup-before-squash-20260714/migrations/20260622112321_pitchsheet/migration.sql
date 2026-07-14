-- CreateTable
CREATE TABLE `PitchSheet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dreamId` INTEGER NOT NULL,
    `layoutKey` VARCHAR(128) NOT NULL DEFAULT 'pitch-card',
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(512) NULL,
    `hook` VARCHAR(512) NULL,
    `pitch` TEXT NULL,
    `highlight1Label` VARCHAR(128) NULL,
    `highlight1Value` VARCHAR(512) NULL,
    `highlight1Icon` VARCHAR(255) NULL,
    `highlight2Label` VARCHAR(128) NULL,
    `highlight2Value` VARCHAR(512) NULL,
    `highlight2Icon` VARCHAR(255) NULL,
    `highlight3Label` VARCHAR(128) NULL,
    `highlight3Value` VARCHAR(512) NULL,
    `highlight3Icon` VARCHAR(255) NULL,
    `detail1Label` VARCHAR(128) NULL,
    `detail1Body` TEXT NULL,
    `detail2Label` VARCHAR(128) NULL,
    `detail2Body` TEXT NULL,
    `detail3Label` VARCHAR(128) NULL,
    `detail3Body` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `icon` VARCHAR(255) NULL,
    `colorTheme` VARCHAR(255) NULL,
    `extraData` JSON NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `designer` VARCHAR(255) NULL DEFAULT 'system',

    UNIQUE INDEX `PitchSheet_dreamId_key`(`dreamId`),
    INDEX `PitchSheet_layoutKey_idx`(`layoutKey`),
    INDEX `PitchSheet_artImageId_idx`(`artImageId`),
    INDEX `PitchSheet_userId_idx`(`userId`),
    INDEX `PitchSheet_isPublic_idx`(`isPublic`),
    INDEX `PitchSheet_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
