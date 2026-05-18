/*
  Warnings:

  - A unique constraint covering the columns `[artId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Art` ADD COLUMN `artImageId` INTEGER NULL,
    ADD COLUMN `hasArtImage` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_artId_key` ON `ArtImage`(`artId`);
