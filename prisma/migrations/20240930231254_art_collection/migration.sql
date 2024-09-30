-- AlterTable
ALTER TABLE `Art` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- CreateTable
CREATE TABLE `ArtCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL DEFAULT 10,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtToArtCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToArtCollection_AB_unique`(`A`, `B`),
    INDEX `_ArtToArtCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArtCollection` ADD CONSTRAINT `ArtCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToArtCollection` ADD CONSTRAINT `_ArtToArtCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToArtCollection` ADD CONSTRAINT `_ArtToArtCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
