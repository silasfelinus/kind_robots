/*
  Warnings:

  - You are about to drop the column `IsHated` on the `Reaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `IsHated`,
    ADD COLUMN `isHated` BOOLEAN NULL DEFAULT false,
    MODIFY `userId` INTEGER NOT NULL DEFAULT 10;
