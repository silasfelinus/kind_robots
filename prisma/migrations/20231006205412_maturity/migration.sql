/*
  Warnings:

  - You are about to drop the column `isNsfw` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `isNsfw` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `isNsfw` on the `Resource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Art` DROP COLUMN `isNsfw`,
    ADD COLUMN `isMature` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `isNsfw`,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `isNsfw`,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;
