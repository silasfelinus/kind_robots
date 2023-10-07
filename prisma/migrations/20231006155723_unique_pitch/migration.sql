/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Pitch` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Pitch_title_key` ON `Pitch`(`title`);
