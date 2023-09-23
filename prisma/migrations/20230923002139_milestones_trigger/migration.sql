/*
  Warnings:

  - Added the required column `triggerCode` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Milestone` ADD COLUMN `triggerCode` VARCHAR(191) NOT NULL;
