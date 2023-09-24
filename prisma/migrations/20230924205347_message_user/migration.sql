/*
  Warnings:

  - Made the column `sender` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recipient` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Message` MODIFY `sender` VARCHAR(191) NOT NULL DEFAULT 'user',
    MODIFY `recipient` VARCHAR(191) NOT NULL DEFAULT 'prompt';
