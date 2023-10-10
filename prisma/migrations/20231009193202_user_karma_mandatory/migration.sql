/*
  Warnings:

  - Made the column `karma` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mana` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `karma` INTEGER NOT NULL DEFAULT 0,
    MODIFY `mana` INTEGER NOT NULL DEFAULT 0;
