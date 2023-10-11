/*
  Warnings:

  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `name`,
    ADD COLUMN `galleryCount` INTEGER NULL,
    ADD COLUMN `imagePath` VARCHAR(191) NULL;
