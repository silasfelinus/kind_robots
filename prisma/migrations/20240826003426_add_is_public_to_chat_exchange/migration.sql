/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `RandomList` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ChatExchange` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `RandomList_title_key` ON `RandomList`(`title`);
