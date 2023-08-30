/*
  Warnings:

  - You are about to drop the column `isUnderConstruction` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `designerId` on the `Design` table. All the data in the column will be lost.
  - You are about to drop the column `designId` on the `Gallery` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Design` DROP FOREIGN KEY `Design_designerId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_designId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_designerId_fkey`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `isUnderConstruction`,
    ADD COLUMN `underConstruction` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Design` DROP COLUMN `designerId`;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `designId`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `address1` VARCHAR(191) NULL,
    ADD COLUMN `address2` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_DesignToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DesignToUser_AB_unique`(`A`, `B`),
    INDEX `_DesignToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DesignToGallery` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DesignToGallery_AB_unique`(`A`, `B`),
    INDEX `_DesignToGallery_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GalleryToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GalleryToUser_AB_unique`(`A`, `B`),
    INDEX `_GalleryToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_DesignToUser` ADD CONSTRAINT `_DesignToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Design`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DesignToUser` ADD CONSTRAINT `_DesignToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DesignToGallery` ADD CONSTRAINT `_DesignToGallery_A_fkey` FOREIGN KEY (`A`) REFERENCES `Design`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DesignToGallery` ADD CONSTRAINT `_DesignToGallery_B_fkey` FOREIGN KEY (`B`) REFERENCES `Gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GalleryToUser` ADD CONSTRAINT `_GalleryToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GalleryToUser` ADD CONSTRAINT `_GalleryToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
