/*
  Warnings:

  - You are about to drop the column `mediaId` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `mediaId`;

-- CreateTable
CREATE TABLE `_ArtToGallery` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToGallery_AB_unique`(`A`, `B`),
    INDEX `_ArtToGallery_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToGallery` ADD CONSTRAINT `_ArtToGallery_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToGallery` ADD CONSTRAINT `_ArtToGallery_B_fkey` FOREIGN KEY (`B`) REFERENCES `Gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
