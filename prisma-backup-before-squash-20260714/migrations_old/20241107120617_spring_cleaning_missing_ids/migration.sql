/*
  Warnings:

  - You are about to drop the column `messageId` on the `ArtImage` table. All the data in the column will be lost.
  - You are about to drop the column `postId` on the `ArtImage` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `postId` on the `Reaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ArtImage_messageId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `ArtImage_postId_key` ON `ArtImage`;

-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `messageId`,
    DROP COLUMN `postId`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `messageId`,
    DROP COLUMN `postId`;
