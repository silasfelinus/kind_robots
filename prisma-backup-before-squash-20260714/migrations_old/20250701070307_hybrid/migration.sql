-- CreateTable
CREATE TABLE `Hybrid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `animalOne` VARCHAR(191) NOT NULL,
    `animalTwo` VARCHAR(191) NOT NULL,
    `blend` INTEGER NOT NULL,
    `promptString` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `artId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `promptId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Hybrid` ADD CONSTRAINT `Hybrid_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hybrid` ADD CONSTRAINT `Hybrid_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hybrid` ADD CONSTRAINT `Hybrid_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hybrid` ADD CONSTRAINT `Hybrid_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
