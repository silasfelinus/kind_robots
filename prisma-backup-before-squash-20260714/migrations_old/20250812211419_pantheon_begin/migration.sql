-- CreateTable
CREATE TABLE `Pantheon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `coverArtImageId` INTEGER NULL,
    `chatId` INTEGER NULL,
    `names` JSON NOT NULL,
    `imageIds` JSON NOT NULL,
    `galleryIds` JSON NOT NULL,
    `editorIds` JSON NOT NULL,
    `reactions` INTEGER NOT NULL DEFAULT 0,
    `tags` JSON NULL,

    UNIQUE INDEX `Pantheon_name_key`(`name`),
    UNIQUE INDEX `Pantheon_slug_key`(`slug`),
    UNIQUE INDEX `Pantheon_chatId_key`(`chatId`),
    INDEX `Pantheon_userId_idx`(`userId`),
    INDEX `Pantheon_isPublic_idx`(`isPublic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pantheon` ADD CONSTRAINT `Pantheon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pantheon` ADD CONSTRAINT `Pantheon_coverArtImageId_fkey` FOREIGN KEY (`coverArtImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pantheon` ADD CONSTRAINT `Pantheon_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
