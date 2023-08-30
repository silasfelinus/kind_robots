/*
  Warnings:

  - Added the required column `channel` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `channel` VARCHAR(191) NOT NULL;
