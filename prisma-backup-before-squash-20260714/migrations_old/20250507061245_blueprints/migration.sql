-- CreateTable
CREATE TABLE `Blueprint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `coverArtId` INTEGER NULL,
    `commands` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Blueprint` ADD CONSTRAINT `Blueprint_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blueprint` ADD CONSTRAINT `Blueprint_coverArtId_fkey` FOREIGN KEY (`coverArtId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
