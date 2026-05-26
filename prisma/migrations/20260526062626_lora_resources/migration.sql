-- CreateTable
CREATE TABLE `_ArtImageLoraResources` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtImageLoraResources_AB_unique`(`A`, `B`),
    INDEX `_ArtImageLoraResources_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtImageLoraResources` ADD CONSTRAINT `_ArtImageLoraResources_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
