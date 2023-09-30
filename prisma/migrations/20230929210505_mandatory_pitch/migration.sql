/*
  Warnings:

  - Made the column `pitch` on table `Art` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Art` MODIFY `pitch` VARCHAR(191) NOT NULL;
