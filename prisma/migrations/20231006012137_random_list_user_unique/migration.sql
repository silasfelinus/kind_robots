/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `RandomList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `RandomList_title_key` ON `RandomList`(`title`);
