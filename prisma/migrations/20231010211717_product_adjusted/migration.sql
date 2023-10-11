/*
  Warnings:

  - You are about to drop the column `content` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `galleryCount` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `content`,
    DROP COLUMN `galleryCount`,
    MODIFY `description` VARCHAR(2000) NOT NULL DEFAULT 'Here''s the idea...';

-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `galleryCount` INTEGER NULL;
