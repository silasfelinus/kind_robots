/*
  Warnings:

  - You are about to drop the column `tokenCount` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `tokenCount`,
    DROP COLUMN `type`;
