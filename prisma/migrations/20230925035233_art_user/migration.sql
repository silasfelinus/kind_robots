/*
  Warnings:

  - You are about to drop the column `designer` on the `Art` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Art` DROP COLUMN `designer`,
    ADD COLUMN `user` VARCHAR(191) NULL;
