/*
  Warnings:

  - You are about to drop the column `data` on the `Model` table. All the data in the column will be lost.
  - Added the required column `content` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Model` DROP COLUMN `data`,
    ADD COLUMN `content` VARCHAR(191) NOT NULL,
    ADD COLUMN `label` VARCHAR(191) NOT NULL;
