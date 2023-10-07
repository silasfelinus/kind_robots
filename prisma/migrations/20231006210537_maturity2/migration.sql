/*
  Warnings:

  - You are about to drop the column `isNSFW` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `isNSFW` on the `Tag` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `isNSFW`,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `isNSFW`,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;
