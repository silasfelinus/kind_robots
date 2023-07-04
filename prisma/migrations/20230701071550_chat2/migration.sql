/*
  Warnings:

  - You are about to drop the column `sender` on the `Message` table. All the data in the column will be lost.
  - Added the required column `role` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `sender`,
    ADD COLUMN `role` VARCHAR(191) NOT NULL;
