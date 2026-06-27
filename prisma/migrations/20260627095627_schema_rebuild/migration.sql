/*
  Warnings:

  - You are about to drop the column `thumbnailData` on the `ArtImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `thumbnailData`,
    ALTER COLUMN `isActive` DROP DEFAULT;
