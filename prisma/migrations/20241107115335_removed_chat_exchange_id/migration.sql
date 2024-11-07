/*
  Warnings:

  - You are about to drop the column `chatExchangeId` on the `ArtImage` table. All the data in the column will be lost.
  - You are about to drop the column `chatExchangeId` on the `Reaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ArtImage_chatExchangeId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `Reaction_chatExchangeId_fkey` ON `Reaction`;

-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `chatExchangeId`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `chatExchangeId`;
